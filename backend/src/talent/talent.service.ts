import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MediaType, Talent, Role, Media, Prisma } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

interface MediaFiles {
  images: Express.Multer.File[];
  videos: Express.Multer.File[];
  audios: Express.Multer.File[];
}

// Media file limits per talent
const MEDIA_LIMITS = {
  [MediaType.IMAGE]: 10,
  [MediaType.VIDEO]: 4,
  [MediaType.AUDIO]: 10,
};

@Injectable()
export class TalentService {
  /**
   * Remove multiple media items by their IDs
   */
  private async removeMultipleMedia(mediaIds: string[]): Promise<void> {
    for (const mediaId of mediaIds) {
      await this.removeMedia(mediaId);
    }
  }
  private async uploadAndCreateMedia(
    talentId: string,
    file: Express.Multer.File,
    mediaType: MediaType,
  ): Promise<void> {
    // Upload file to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadSingleFile(
      file,
      mediaType,
      talentId,
    );

    if (!uploadResult || !uploadResult.url) {
      throw new BadRequestException('Failed to upload file to Cloudinary');
    }

    // Create media record in the database
    await this.prisma.media.create({
      data: {
        type: mediaType,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        description: '',
        talentId,
      },
    });
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService, // Inject MailService
  ) {}

  /**
   * Helper method to update talent profile data from DTO
   * @param updateTalentDto DTO with talent update data
   * @returns Prisma-compatible update data object
   */
  private buildTalentUpdateData(
    updateTalentDto: UpdateTalentDto,
  ): Prisma.TalentUpdateInput {
    const updateData: Prisma.TalentUpdateInput = {};

    // Map all fields that can be directly assigned
    const directFields = [
      'firstName',
      'lastName',
      'generalCategory',
      'specificCategory',
      'serviceName',
      'address',
      'phoneNumber',
      'isEmailVerified',
      'verificationToken',
      'isOnline',
      'isPublic',
      'languagesSpoken',
      'bio',
      'services',
      'hourlyRate',
      'city',
      'availability',
      'socialLinks',
    ] as const;

    for (const field of directFields) {
      if (updateTalentDto[field] !== undefined) {
        updateData[field] = updateTalentDto[field];
      }
    }

    // Handle status field separately due to type validation
    if (
      updateTalentDto.status !== undefined &&
      typeof updateTalentDto.status === 'string'
    ) {
      updateData.status = updateTalentDto.status;
    }

    return updateData;
  }

  /**
   * Check if adding new media files would exceed the limits
   * @param talentId Talent ID to check
   * @param files New files being uploaded
   * @returns Object with validation results and count information
   */
  private async validateMediaLimits(
    talentId: string,
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      audios?: Express.Multer.File[];
    },
  ): Promise<{
    valid: boolean;
    errors: string[];
    currentCounts: Record<MediaType, number>;
    totalAfterUpload: Record<MediaType, number>;
  }> {
    // Get current media counts for this talent
    const existingMedia = await this.prisma.media.findMany({
      where: { talentId },
      select: { type: true },
    });

    // Count media by type
    const currentCounts = {
      [MediaType.IMAGE]: 0,
      [MediaType.VIDEO]: 0,
      [MediaType.AUDIO]: 0,
    };

    existingMedia.forEach((media) => {
      currentCounts[media.type]++;
    });

    // Calculate counts after upload
    const totalAfterUpload = {
      [MediaType.IMAGE]:
        currentCounts[MediaType.IMAGE] + (files.images?.length || 0),
      [MediaType.VIDEO]:
        currentCounts[MediaType.VIDEO] + (files.videos?.length || 0),
      [MediaType.AUDIO]:
        currentCounts[MediaType.AUDIO] + (files.audios?.length || 0),
    };

    // Check if any limits would be exceeded
    const errors: string[] = [];

    if (totalAfterUpload[MediaType.IMAGE] > MEDIA_LIMITS[MediaType.IMAGE]) {
      errors.push(
        `Image limit exceeded. Maximum ${MEDIA_LIMITS[MediaType.IMAGE]} images allowed. You currently have ${currentCounts[MediaType.IMAGE]} and are trying to add ${files.images?.length || 0} more.`,
      );
    }

    if (totalAfterUpload[MediaType.VIDEO] > MEDIA_LIMITS[MediaType.VIDEO]) {
      errors.push(
        `Video limit exceeded. Maximum ${MEDIA_LIMITS[MediaType.VIDEO]} videos allowed. You currently have ${currentCounts[MediaType.VIDEO]} and are trying to add ${files.videos?.length || 0} more.`,
      );
    }

    if (totalAfterUpload[MediaType.AUDIO] > MEDIA_LIMITS[MediaType.AUDIO]) {
      errors.push(
        `Audio limit exceeded. Maximum ${MEDIA_LIMITS[MediaType.AUDIO]} audio files allowed. You currently have ${currentCounts[MediaType.AUDIO]} and are trying to add ${files.audios?.length || 0} more.`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      currentCounts,
      totalAfterUpload,
    };
  }

  /**
   * Filter files to ensure they don't exceed limits when added
   * @param talentId Talent ID
   * @param mediaFiles Media files to be filtered
   * @returns Filtered media files that won't exceed limits
   */
  private async filterFilesToRespectLimits(
    talentId: string,
    mediaFiles: MediaFiles,
  ): Promise<{ mediaFiles: MediaFiles; removed: Record<MediaType, number> }> {
    const { currentCounts } = await this.validateMediaLimits(
      talentId,
      mediaFiles,
    );
    const removed = {
      [MediaType.IMAGE]: 0,
      [MediaType.VIDEO]: 0,
      [MediaType.AUDIO]: 0,
    };

    // Calculate how many of each type we can add
    const remainingSlots = {
      [MediaType.IMAGE]: Math.max(
        0,
        MEDIA_LIMITS[MediaType.IMAGE] - currentCounts[MediaType.IMAGE],
      ),
      [MediaType.VIDEO]: Math.max(
        0,
        MEDIA_LIMITS[MediaType.VIDEO] - currentCounts[MediaType.VIDEO],
      ),
      [MediaType.AUDIO]: Math.max(
        0,
        MEDIA_LIMITS[MediaType.AUDIO] - currentCounts[MediaType.AUDIO],
      ),
    };

    // Filter media files to respect limits
    const filteredFiles: MediaFiles = {
      images: mediaFiles.images.slice(0, remainingSlots[MediaType.IMAGE]),
      videos: mediaFiles.videos.slice(0, remainingSlots[MediaType.VIDEO]),
      audios: mediaFiles.audios.slice(0, remainingSlots[MediaType.AUDIO]),
    };

    // Calculate how many files were removed
    removed[MediaType.IMAGE] =
      mediaFiles.images.length - filteredFiles.images.length;
    removed[MediaType.VIDEO] =
      mediaFiles.videos.length - filteredFiles.videos.length;
    removed[MediaType.AUDIO] =
      mediaFiles.audios.length - filteredFiles.audios.length;

    return { mediaFiles: filteredFiles, removed };
  }

  /**
   * Create a new talent profile with media files
   */
  async createWithMedia(
    userId: string,
    createTalentDto: CreateTalentDto,
    files: {
      profilePicture: Express.Multer.File;
      images: Express.Multer.File[];
      videos: Express.Multer.File[];
      audios: Express.Multer.File[];
    },
  ) {
    // Check if talent already exists for this user
    const existingTalent = await this.prisma.talent.findUnique({
      where: { talentId: userId },
    });

    if (existingTalent) {
      throw new ConflictException('User already has a talent profile');
    }

    // First upload the profile picture to Cloudinary
    let profilePictureUrl = '';
    if (files.profilePicture) {
      try {
        const uploadResult = await this.cloudinaryService.uploadProfilePicture(
          files.profilePicture,
          userId,
        );
        profilePictureUrl = uploadResult.url;
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw new BadRequestException('Failed to upload profile picture');
      }
    }

    // Create talent profile with the profile picture URL
    const talent = await this.prisma.talent.create({
      data: {
        talentId: userId,
        firstName: createTalentDto.firstName,
        lastName: createTalentDto.lastName,
        talentProfilePicture: profilePictureUrl, // Set the profile picture URL
        generalCategory: createTalentDto.generalCategory,
        specificCategory: createTalentDto.specificCategory,
        serviceName: createTalentDto.serviceName,
        address: createTalentDto.address,
        phoneNumber: createTalentDto.phoneNumber,
        status: createTalentDto.status,
        isEmailVerified: createTalentDto.isEmailVerified,
        isPublic: createTalentDto.isPublic,
        verificationToken:
          createTalentDto.verificationToken || crypto.randomUUID(),
        languagesSpoken: createTalentDto.languagesSpoken,
        bio: createTalentDto.bio,
        services: createTalentDto.services,
        hourlyRate: createTalentDto.hourlyRate,
        city: createTalentDto.city,
        availability: createTalentDto.availability,
        socialLinks: createTalentDto.socialLinks,
        isOnline: createTalentDto.isOnline,
      },
    });

    // Process and upload media files if any
    if (
      files.images.length > 0 ||
      files.videos.length > 0 ||
      files.audios.length > 0
    ) {
      const mediaUploads: Promise<void>[] = [];

      // Process images
      for (const file of files.images) {
        mediaUploads.push(
          this.uploadAndCreateMedia(talent.talentId, file, MediaType.IMAGE),
        );
      }

      // Process videos
      for (const file of files.videos) {
        mediaUploads.push(
          this.uploadAndCreateMedia(talent.talentId, file, MediaType.VIDEO),
        );
      }

      // Process audios
      for (const file of files.audios) {
        mediaUploads.push(
          this.uploadAndCreateMedia(talent.talentId, file, MediaType.AUDIO),
        );
      }

      await Promise.all(mediaUploads);
    }

    // Return the created talent with media
    return this.findOne(talent.talentId);
  }

  /**
   * Update a talent profile with optional media files
   */
  async updateWithMedia(
    id: string,
    updateTalentDto: UpdateTalentDto,
    files: {
      profilePicture?: Express.Multer.File;
      images: Express.Multer.File[];
      videos: Express.Multer.File[];
      audios: Express.Multer.File[];
    } | null,
  ) {
    // Check if talent exists
    const talent = await this.prisma.talent.findUnique({
      where: { talentId: id },
    });

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${id} not found`);
    }

    // Update talent profile
    const updateData = this.buildTalentUpdateData(updateTalentDto);

    // Upload new profile picture if provided
    if (files?.profilePicture) {
      try {
        const uploadResult = await this.cloudinaryService.uploadProfilePicture(
          files.profilePicture,
          id,
        );
        updateData.talentProfilePicture = uploadResult.url;
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw new BadRequestException('Failed to upload profile picture');
      }
    }

    // Remove media if specified
    if (
      updateTalentDto.mediasToRemove &&
      updateTalentDto.mediasToRemove.length > 0
    ) {
      await this.removeMultipleMedia(updateTalentDto.mediasToRemove);
    }

    // Update talent profile
    await this.prisma.talent.update({
      where: { talentId: id },
      data: updateData,
    });

    // Process and upload new media files if any
    if (files) {
      const mediaUploads: Promise<void>[] = [];

      // Process images
      for (const file of files.images) {
        mediaUploads.push(this.uploadAndCreateMedia(id, file, MediaType.IMAGE));
      }

      // Process videos
      for (const file of files.videos) {
        mediaUploads.push(this.uploadAndCreateMedia(id, file, MediaType.VIDEO));
      }

      // Process audios
      for (const file of files.audios) {
        mediaUploads.push(this.uploadAndCreateMedia(id, file, MediaType.AUDIO));
      }

      await Promise.all(mediaUploads);
    }

    // Return the updated talent with media
    return this.findOne(id);
  }

  /**
   * Add multiple media files to a talent's portfolio
   */
  async addMultipleMedia(
    talentId: string,
    mediaFiles: MediaFiles,
  ): Promise<{
    addedMedia: Media[];
    skippedFiles?: Record<string, number>;
    warnings?: string[];
  }> {
    // Check if talent exists
    const talent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId },
      }),
    );

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Check if any files were provided
    const hasFiles =
      mediaFiles.images.length > 0 ||
      mediaFiles.videos.length > 0 ||
      mediaFiles.audios.length > 0;

    if (!hasFiles) {
      throw new BadRequestException('No media files provided');
    }

    // Validate media limits and get info about current counts
    const validationResult = await this.validateMediaLimits(
      talentId,
      mediaFiles,
    );

    // If we would exceed limits, decide what to do
    if (!validationResult.valid) {
      // Filter files to only include what won't exceed limits
      const { mediaFiles: filteredFiles, removed } =
        await this.filterFilesToRespectLimits(talentId, mediaFiles);

      // Check if all files were removed due to limits
      const allRemoved =
        removed[MediaType.IMAGE] === mediaFiles.images.length &&
        removed[MediaType.VIDEO] === mediaFiles.videos.length &&
        removed[MediaType.AUDIO] === mediaFiles.audios.length;

      if (allRemoved) {
        throw new BadRequestException(validationResult.errors.join(' '));
      }

      // Process the filtered files and return warnings
      const addedMedia = await this.processAndUploadMedia(
        talentId,
        filteredFiles,
      );
      return {
        addedMedia,
        skippedFiles: {
          images: removed[MediaType.IMAGE],
          videos: removed[MediaType.VIDEO],
          audio: removed[MediaType.AUDIO],
        },
        warnings: validationResult.errors,
      };
    }

    // If we're within limits, process all files
    const addedMedia = await this.processAndUploadMedia(talentId, mediaFiles);
    return { addedMedia };
  }

  /**
   * Process and upload multiple media files to Cloudinary and store in database
   */
  private async processAndUploadMedia(
    talentId: string,
    mediaFiles: MediaFiles,
  ): Promise<Media[]> {
    const allFiles = [
      ...mediaFiles.images.map((file) => ({ file, type: MediaType.IMAGE })),
      ...mediaFiles.videos.map((file) => ({ file, type: MediaType.VIDEO })),
      ...mediaFiles.audios.map((file) => ({ file, type: MediaType.AUDIO })),
    ];

    // Upload all files to Cloudinary
    const uploadResults = await this.cloudinaryService.uploadFiles(
      allFiles.map((item) => item.file),
      talentId,
    );

    // Map Cloudinary upload results to media records
    const mediaToCreate = allFiles.map((item, index) => ({
      type: item.type,
      url: uploadResults[index]?.url ?? '',
      publicId: uploadResults[index]?.publicId ?? '',
      description: '',
      talentId,
    }));

    // Create media records in database
    await this.prisma.safeQuery(() =>
      this.prisma.media.createMany({
        data: mediaToCreate,
      }),
    );

    // Fetch the created media records
    const media = await this.prisma.safeQuery(() =>
      this.prisma.media.findMany({
        where: { talentId },
        orderBy: { createdAt: 'desc' },
        take: mediaToCreate.length,
      }),
    );

    return media;
  }

  /**
   * Create a new talent profile
   * @param userId User ID to associate with talent profile
   * @param createTalentDto Talent data
   * @returns Created talent profile
   */
  async create(
    userId: string,
    createTalentDto: CreateTalentDto,
  ): Promise<Talent> {
    return this.createWithMedia(userId, createTalentDto, {
      profilePicture: null as unknown as Express.Multer.File,
      images: [],
      videos: [],
      audios: [],
    });
  }

  /**
   * Find all talent profiles with optional filtering and pagination
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    services?: string[];
    minHourlyRate?: number;
    maxHourlyRate?: number;
    city?: string; // Changed from location to city
    minRating?: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    isEmailVerified?: boolean;
    isPublic?: boolean;
  }) {
    const {
      skip = 0,
      take = 10,
      services,
      minHourlyRate,
      maxHourlyRate,
      city, // Changed from location to city
      minRating,
      status,
      isEmailVerified,
      isPublic,
    } = params;

    // Build where conditions based on filters
    const where: {
      services?: { hasSome: string[] };
      hourlyRate?: { gte?: number; lte?: number };
      city?: { contains: string; mode: 'insensitive' }; // Changed from location to city
      rating?: { gte: number };
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
      isEmailVerified?: boolean;
      isPublic?: boolean;
    } = {};

    if (services?.length) {
      where.services = { hasSome: services };
    }

    if (minHourlyRate !== undefined || maxHourlyRate !== undefined) {
      where.hourlyRate = {};
      if (minHourlyRate !== undefined) where.hourlyRate.gte = minHourlyRate;
      if (maxHourlyRate !== undefined) where.hourlyRate.lte = maxHourlyRate;
    }

    if (city) {
      // Changed from location to city
      where.city = { contains: city, mode: 'insensitive' }; // Changed from location to city
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    if (status) {
      where.status = status;
    }

    if (isEmailVerified) {
      where.isEmailVerified = isEmailVerified;
    }

    if (isPublic) {
      where.isPublic = isPublic;
    }

    // Get talents with pagination and filtering
    const talents = await this.prisma.safeQuery(() =>
      this.prisma.talent.findMany({
        where,
        skip,
        take,
        include: {
          media: true,
          user: {
            select: {
              name: true,
              profilePicture: true,
              email: true,
            },
          },
        },
        orderBy: { rating: 'desc' },
      }),
    );

    // Get total count for pagination
    const totalCount = await this.prisma.safeQuery(() =>
      this.prisma.talent.count({ where }),
    );

    return {
      talents,
      totalCount,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      pageCount: Math.ceil(totalCount / take),
    };
  }

  /**
   * Find a talent profile by ID
   */
  async findOne(talentId: string) {
    try {
      const talent = await this.prisma.safeQuery(() =>
        this.prisma.talent.findUnique({
          where: { talentId },
          include: {
            media: true,
            user: {
              select: {
                name: true,
                profilePicture: true,
                email: true,
                createdAt: true,
              },
            },
            reviews: {
              include: {
                user: {
                  select: {
                    name: true,
                    profilePicture: true,
                  },
                },
                replies: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        }),
      );

      if (!talent) {
        throw new NotFoundException(`Talent with ID ${talentId} not found`);
      }

      return talent;
    } catch (error) {
      // If the error is already a NotFoundException, rethrow it
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Log the original error
      console.error(`Error fetching talent with ID ${talentId}`, error);

      // Throw a generic error
      throw new InternalServerErrorException('Error retrieving talent profile');
    }
  }

  /**
   * Find a talent profile by user ID
   */
  async findByUserId(userId: string) {
    try {
      const talent = await this.prisma.safeQuery(() =>
        this.prisma.talent.findUnique({
          where: { talentId: userId }, // In your schema, talentId is the same as userId
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profilePicture: true,
              },
            },
            // Only include basic details for status checks
            // This reduces the query complexity
            media: {
              take: 1, // Just check if there's any media
              select: {
                id: true,
              },
            },
          },
        }),
      );

      if (!talent) {
        throw new NotFoundException(`Talent with user ID ${userId} not found`);
      }

      return talent;
    } catch (error) {
      // If the error is already a NotFoundException, rethrow it
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Error fetching talent with user ID ${userId}`, error);
      throw new InternalServerErrorException('Error retrieving talent profile');
    }
  }

  /**
   * Update a talent profile
   */
  async update(talentId: string, updateTalentDto: UpdateTalentDto) {
    // Check if talent exists
    const existingTalent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId },
      }),
    );

    if (!existingTalent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Update talent profile
    return this.prisma.safeQuery(() =>
      this.prisma.talent.update({
        where: { talentId },
        data: this.buildTalentUpdateData(updateTalentDto),
        include: {
          media: true,
        },
      }),
    );
  }

  /**
   * Remove a talent profile
   */
  async remove(talentId: string, userId: string | undefined) {
    // Check if talent exists
    const existingTalent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId },
        include: {
          user: {
            select: {
              userId: true,
            },
          },
          media: true,
        },
      }),
    );

    if (!existingTalent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    if (!userId) {
      throw new Error('userId is undefined');
    }

    if (existingTalent.user.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own talent profile',
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    return await this.prisma.$transaction(async (tx) => {
      // 1. First delete all media records from Cloudinary
      for (const media of existingTalent.media) {
        if (media.publicId) {
          await this.cloudinaryService.deleteFile(media.publicId);
        }
      }

      // 2. Delete all media records from the database
      await tx.media.deleteMany({
        where: { talentId },
      });

      // 3. Delete the talent profile
      await tx.talent.delete({
        where: { talentId },
      });

      // 4. Update user role back to CUSTOMER
      await tx.user.update({
        where: { userId: talentId },
        data: { role: Role.CUSTOMER },
      });

      return { success: true, message: 'Talent profile deleted successfully' };
    });
  }

  /**
   * Adds media to a talent's portfolio
   */
  async addMedia(
    talentId: string,
    file: Express.Multer.File,
    mediaType: MediaType,
    description?: string,
  ) {
    // Check if talent exists
    const talent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId },
      }),
    );

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadSingleFile(
      file,
      mediaType,
      talentId,
    );

    if (!uploadResult || !uploadResult.url) {
      throw new BadRequestException('Failed to upload file to Cloudinary');
    }

    // Create media record in database
    const media = await this.prisma.safeQuery(() =>
      this.prisma.media.create({
        data: {
          type: mediaType,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          description: description || '',
          talentId,
        },
      }),
    );

    return media;
  }

  /**
   * Remove media from a talent's portfolio
   */
  async removeMedia(mediaId: string) {
    // Find the media
    const media = await this.prisma.safeQuery(() =>
      this.prisma.media.findUnique({
        where: { id: mediaId },
      }),
    );

    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    // Delete from Cloudinary
    const publicId = this.cloudinaryService.extractPublicIdFromUrl(media.url);

    if (publicId) {
      try {
        const deleteResult = await this.cloudinaryService.deleteFile(publicId);
        console.log('Cloudinary deletion result:', deleteResult);
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    } else {
      console.warn('Could not extract public ID from URL:', media.url);
    }

    // Delete from database
    await this.prisma.safeQuery(() =>
      this.prisma.media.delete({
        where: { id: mediaId },
      }),
    );

    return { success: true, message: 'Media deleted successfully' };
  }

  /**
   * Verify email using a token
   */
  async verifyEmail(token: string) {
    const talent = await this.prisma.talent.findFirst({
      where: { verificationToken: token },
    });

    if (!talent) {
      throw new NotFoundException('Invalid verification token');
    }

    // Update the talent record
    return this.prisma.talent.update({
      where: { talentId: talent.talentId },
      data: {
        isEmailVerified: true,
      },
    });
  }

  /**
   * Update the status of a talent profile
   */
  async updateStatus(
    talentId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
  ) {
    const talent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId },
      }),
    );

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Update the talent status and rejection reason if provided
    const updateData: Prisma.TalentUpdateInput = { status };
    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // Update the talent status
    const updatedTalent = await this.prisma.safeQuery(() =>
      this.prisma.talent.update({
        where: { talentId },
        data: updateData,
      }),
    );

    // Get user email for notifications
    const user = await this.prisma.safeQuery(() =>
      this.prisma.user.findUnique({
        where: { userId: talent.talentId },
        select: { email: true, name: true },
      }),
    );

    if (user) {
      // If the talent was approved, send an approval email notification
      if (status === 'APPROVED') {
        await this.mailService.sendTalentApprovalEmail(user.email, user.name);
      }
      // If the talent was rejected, send a rejection email notification
      else if (status === 'REJECTED') {
        await this.mailService.sendTalentRejectionEmail(
          user.email,
          user.name,
          rejectionReason ||
            'Your application did not meet our current requirements.',
        );
      }
    }

    return updatedTalent;
  }

  /**
   * Update a talent's profile picture
   * @param talentId The ID of the talent
   * @param file The profile picture file to upload
   * @returns Updated talent with new profile picture URL
   */
  async updateProfilePicture(
    talentId: string,
    file: Express.Multer.File,
  ): Promise<Talent> {
    // Check if talent exists
    const talent = await this.prisma.talent.findUnique({
      where: { talentId },
    });

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Upload profile picture to Cloudinary
    try {
      const uploadResult = await this.cloudinaryService.uploadProfilePicture(
        file,
        talentId,
      );

      // Update talent profile with new profile picture URL
      return this.prisma.talent.update({
        where: { talentId },
        data: {
          talentProfilePicture: uploadResult.url,
        },
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new BadRequestException('Failed to upload profile picture');
    }
  }
}
