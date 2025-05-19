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
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import {
  MediaType,
  Talent,
  Role,
  Media,
  Prisma,
  CalendarEvent,
} from '@prisma/client';
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
  ) { }
  /**
   * Helper method to update talent profile data from DTO
   * @param updateTalentDto DTO with talent update data
   * @returns Prisma-compatible update data object
   */
  private async buildTalentUpdateData(
    updateTalentDto: UpdateTalentDto,
  ): Promise<Prisma.TalentUpdateInput> {
    const updateData: Prisma.TalentUpdateInput = {}; // Map all fields that can be directly assigned
    const directFields = [
      'firstName',
      'lastName',
      'email',
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
   * Assign categories to a talent
   * @param talentId Talent ID
   * @param categoryIds Array of category IDs to assign
   * @returns Array of created TalentCategory relationships
   */
  private async assignCategoriesToTalent(
    talentId: string,
    categoryIds: string[],
  ) {
    // First, get all existing categories
    const existingCategories = await this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
    });

    const existingIds = existingCategories.map(cat => cat.id);
    const missingIds = categoryIds.filter(id => !existingIds.includes(id));

    // Create missing categories with PENDING status
    if (missingIds.length > 0) {
      const categoriesToCreate = missingIds.map(id => ({
        id,
        name: `Category ${id}`, // Using ID as part of name since we don't have the actual name
        type: 'GENERAL' as const, // Default to GENERAL type
        status: 'PENDING' as const,
      }));

      await this.prisma.category.createMany({
        data: categoriesToCreate,
        skipDuplicates: true,
      });
    }

    // Now get all categories (including newly created ones)
    const allCategories = await this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
    });

    // Filter to only include ACTIVE categories for relationship creation
    const activeCategories = allCategories.filter(category => category.status === 'ACTIVE');

    // Create the talent-category relationships only for ACTIVE categories
    const talentCategories = await this.prisma.safeQuery(() =>
      Promise.all(
        activeCategories.map((category) =>
          this.prisma.talentCategory.create({
            data: {
              talentId,
              categoryId: category.id,
            },
          }),
        ),
      ),
    );

    return talentCategories;
  }

  /**
   * Remove category assignments from a talent
   * @param talentId Talent ID
   * @param categoryIds Array of category IDs to remove
   */
  private async removeCategoriesFromTalent(
    talentId: string,
    categoryIds: string[],
  ) {
    await this.prisma.safeQuery(() =>
      this.prisma.talentCategory.deleteMany({
        where: {
          talentId,
          categoryId: {
            in: categoryIds,
          },
        },
      }),
    );
  }

  /**
   * Get all categories assigned to a talent
   * @param talentId Talent ID
   * @returns Array of categories with their details
   */
  private async getTalentCategories(talentId: string) {
    const talentWithCategories = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      }),
    );

    if (!talentWithCategories) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    return talentWithCategories.categories.map((tc) => tc.category);
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
        email: createTalentDto.email,
        talentProfilePicture: profilePictureUrl,
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

    // Add categories if provided
    if (
      (createTalentDto.generalCategories && createTalentDto.generalCategories.length > 0) ||
      (createTalentDto.specificCategories && createTalentDto.specificCategories.length > 0)
    ) {
      await this.assignCategoriesToTalent(
        talent.talentId,
        createTalentDto.generalCategories || [],
      );
    }

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
    const talent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId: id },
      })
    );

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${id} not found`);
    }

    // Update talent profile
    const updateData = await this.buildTalentUpdateData(updateTalentDto);

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

    // Update talent profile
    await this.prisma.safeQuery(() =>
      this.prisma.talent.update({
        where: { talentId: id },
        data: updateData,
      })
    );

    // Handle categories if provided
    if (updateTalentDto.categories && updateTalentDto.categories.length > 0) {
      // First remove all existing categories if we're replacing them
      if (!updateTalentDto.removedCategories) {
        const existingCategories = await this.getTalentCategories(id);
        await this.removeCategoriesFromTalent(
          id,
          existingCategories.map((cat) => cat.id),
        );
      }

      // Then add the new categories
      await this.assignCategoriesToTalent(
        id,
        updateTalentDto.categories,
      );
    }

    // Handle removed categories if specified
    if (
      updateTalentDto.removedCategories &&
      updateTalentDto.removedCategories.length > 0
    ) {
      await this.removeCategoriesFromTalent(
        id,
        updateTalentDto.removedCategories,
      );
    }

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
    city?: string;
    minRating?: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    isEmailVerified?: boolean;
    isPublic?: boolean;
    search?: string;
    generalCategory?: string;
    languages?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      skip = 0,
      take = 10,
      services,
      minHourlyRate,
      maxHourlyRate,
      city,
      minRating,
      status,
      isEmailVerified,
      isPublic,
      search,
      generalCategory,
      languages,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    // Build where conditions based on filters
    const where: Prisma.TalentWhereInput = {};

    if (services?.length) {
      where.services = { hasSome: services };
    }

    if (minHourlyRate !== undefined || maxHourlyRate !== undefined) {
      where.hourlyRate = {};
      if (minHourlyRate !== undefined) where.hourlyRate.gte = minHourlyRate;
      if (maxHourlyRate !== undefined) where.hourlyRate.lte = maxHourlyRate;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    if (languages?.length) {
      where.languagesSpoken = { hasSome: languages };
    }

    if (status) {
      where.status = status;
    }

    if (isEmailVerified !== undefined) {
      where.isEmailVerified = isEmailVerified;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    // Handle generalCategory filter
    if (generalCategory) {
      where.categories = {
        some: {
          category: {
            name: generalCategory,
            type: 'GENERAL',
          },
        },
      };
    }

    // Handle search parameter - search across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { serviceName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determine the ordering based on sortBy and sortOrder
    const orderBy: Record<string, 'asc' | 'desc'> = {};

    // Handle different sort options
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder || 'desc';
    } else if (sortBy === 'hourlyRate') {
      orderBy.hourlyRate = sortOrder || 'asc';
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder || 'desc';
    } else {
      // Default sorting
      orderBy.createdAt = 'desc';
    }

    try {
      // Use safeQuery to get talents with pagination and filtering
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
            categories: {
              include: {
                category: true,
              },
            },
          },
          orderBy,
        }),
      );

      // Get total count for pagination using safeQuery
      const totalCount = await this.prisma.safeQuery(() =>
        this.prisma.talent.count({
          where,
        }),
      );

      return {
        talents,
        totalCount,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
        pageCount: Math.ceil(totalCount / take),
      };
    } catch (error) {
      console.error('Error in findAll talents:', error);
      throw new InternalServerErrorException('Failed to retrieve talents');
    }
  }
  /**
   * Find a talent profile by service name (slugified)
   */
  async findByServiceName(serviceName: string) {
    // Convert the URL-friendly service name to a proper format
    // This example assumes a simple slugification: "professional-singer" -> "Professional Singer"
    // You might need a more sophisticated conversion depending on your slugification method
    const decodedServiceName = decodeURIComponent(serviceName)
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const talent = await this.prisma.talent.findFirst({
      where: {
        serviceName: {
          equals: decodedServiceName,
          mode: 'insensitive',
        },
        isPublic: true,
        status: 'APPROVED',
        isEmailVerified: true,
      },
      include: {
        media: true,
        reviews: {
          take: 2, // Initially load just a few reviews
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                name: true,
                profilePicture: true,
              },
            },
          },
        },
      },
    });

    if (!talent) {
      throw new NotFoundException(
        `Talent with service name ${serviceName} not found`,
      );
    }

    // Format the reviews to include user name
    const formattedTalent = {
      ...talent,
      reviews: talent.reviews.map((review) => ({
        ...review,
        user: {
          name: review.user || null,
          profilePicture: review.user?.profilePicture || null,
        },
      })),
    };

    return formattedTalent;
  }

  /**
   * Find a talent profile by ID
   */
  async findOne(talentId: string) {
    try {
      const talent = await this.prisma.talent.findUnique({
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
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

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
      const talent = await this.prisma.talent.findUnique({
        where: { talentId: userId }, // In your schema, talentId is the same as userId
        include: {
          user: {
            select: {
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          // Include categories
          categories: {
            include: {
              category: true,
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
      });

      // If no talent is found, throw a NotFoundException
      if (!talent) {
        throw new NotFoundException(
          `No talent profile found for user ID ${userId}`,
        );
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
    return this.prisma.safeQuery(async () =>
      this.prisma.talent.update({
        where: { talentId },
        data: await this.buildTalentUpdateData(updateTalentDto),
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
   * Get reviews for a talent with pagination
   */
  async getTalentReviews(talentId: string, page = 1, limit = 5) {
    // Check if talent exists
    const talent = await this.prisma.talent.findUnique({
      where: { talentId },
      select: { talentId: true, rating: true },
    });

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Get total review count
    const totalReviews = await this.prisma.review.count({
      where: { talentReviewId: talentId },
    });

    // Get reviews with pagination
    const reviews = await this.prisma.review.findMany({
      where: { talentReviewId: talentId },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Format reviews to match expected structure
    const formattedReviews = reviews.map((review) => ({
      reviewId: review.reviewId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        name: review.user || null,
        profilePicture: review.user?.profilePicture || null,
      },
    }));

    // Calculate if there are more reviews
    const hasMore = totalReviews > page * limit;

    return {
      reviews: formattedReviews,
      total: totalReviews,
      averageRating: talent.rating,
      hasMore,
    };
  }

  /**
   * Add a review for a talent
   */
  async addReview(
    talentId: string,
    userId: string,
    rating: number,
    comment: string,
  ) {
    // Check if talent exists
    const talent = await this.prisma.talent.findUnique({
      where: { talentId },
      select: { talentId: true },
    });

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Check if user has already reviewed this talent
    const existingReview = await this.prisma.review.findFirst({
      where: {
        talentReviewId: talentId,
        userRevieweId: userId,
      },
    });

    // If user has already reviewed, update the existing review
    if (existingReview) {
      const updatedReview = await this.prisma.review.update({
        where: { reviewId: existingReview.reviewId },
        data: {
          rating,
          comment,
          createdAt: new Date(),
        },
      });

      // Update talent's average rating
      await this.updateTalentRating(talentId);

      return updatedReview;
    }

    // Otherwise, create a new review
    const newReview = await this.prisma.review.create({
      data: {
        rating,
        comment,
        talentReviewId: talentId,
        userRevieweId: userId,
      },
    });

    // Update talent's average rating
    await this.updateTalentRating(talentId);

    return newReview;
  }

  /**
   * Update a talent's average rating
   */
  private async updateTalentRating(talentId: string) {
    // Get all reviews for this talent
    const reviews = await this.prisma.review.findMany({
      where: { talentReviewId: talentId },
      select: { rating: true },
    });

    // Calculate average rating
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Update talent with new average rating
    await this.prisma.talent.update({
      where: { talentId },
      data: { rating: averageRating },
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

    // Update the user role to TALENT if status is APPROVED
    if (status === 'APPROVED') {
      await this.prisma.safeQuery(() =>
        this.prisma.user.update({
          where: { userId: talent.talentId },
          data: { role: Role.TALENT },
        }),
      );
    }

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

  /**
   * Create a calendar event for a talent
   * @param talentId Talent's ID
   * @param createCalendarEventDto Calendar event data
   * @returns Created calendar event
   */
  async createCalendarEvent(
    talentId: string,
    createCalendarEventDto: CreateCalendarEventDto,
  ): Promise<CalendarEvent> {
    // Verify talent exists
    const talent = await this.prisma.talent.findUnique({
      where: { talentId },
    });

    if (!talent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // Create the event
    if (
      !this.prisma ||
      typeof this.prisma.calendarEvent?.create !== 'function'
    ) {
      throw new InternalServerErrorException(
        'Prisma service or calendarEvent is not initialized properly',
      );
    }

    return await this.prisma.calendarEvent.create({
      data: {
        talentId,
        type: createCalendarEventDto.type,
        title: createCalendarEventDto.title,
        start: new Date(createCalendarEventDto.start),
        end: new Date(createCalendarEventDto.end),
        color: createCalendarEventDto.color,
        clientName: createCalendarEventDto.clientName,
        isAllDay: createCalendarEventDto.isAllDay || false,
      },
    });
  }

  /**
   * Get all calendar events for a talent
   * @param talentId Talent's ID
   * @param startDate Optional start date to filter events
   * @param endDate Optional end date to filter events
   * @returns List of calendar events
   */
  async getCalendarEvents(
    talentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<CalendarEvent[]> {
    // Build the where clause with proper typing
    const whereClause: Prisma.CalendarEventWhereInput = { talentId };

    // Add date filters if provided
    if (startDate || endDate) {
      const dateConditions: Prisma.CalendarEventWhereInput[] = [];

      if (startDate && endDate) {
        // Events that overlap with the date range
        dateConditions.push({
          AND: [
            { start: { lte: new Date(endDate) } },
            { end: { gte: new Date(startDate) } },
          ],
        });
      } else if (startDate) {
        dateConditions.push({ start: { gte: new Date(startDate) } });
      } else if (endDate) {
        dateConditions.push({ end: { lte: new Date(endDate) } });
      }

      if (dateConditions.length > 0) {
        whereClause.OR = dateConditions;
      }
    }

    // Fetch events
    return await this.prisma.calendarEvent.findMany({
      where: whereClause,
      orderBy: { start: 'asc' },
    });
  }

  /**
   * Get a specific calendar event by ID
   * @param id Event ID
   * @returns Calendar event or null if not found
   */
  async getCalendarEvent(id: string): Promise<CalendarEvent | null> {
    return await this.prisma.calendarEvent.findUnique({
      where: { id },
    });
  }

  /**
   * Update a calendar event
   * @param id Event ID
   * @param updateCalendarEventDto Updated event data
   * @returns Updated calendar event
   */
  async updateCalendarEvent(
    id: string,
    updateCalendarEventDto: UpdateCalendarEventDto,
  ): Promise<CalendarEvent> {
    // Check if event exists
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${id} not found`);
    }

    // Build update data with proper types
    const updateData: Prisma.CalendarEventUpdateInput = {};

    if (updateCalendarEventDto.type !== undefined) {
      updateData.type = updateCalendarEventDto.type;
    }

    if (updateCalendarEventDto.title !== undefined) {
      updateData.title = updateCalendarEventDto.title;
    }

    if (updateCalendarEventDto.start !== undefined) {
      updateData.start = new Date(updateCalendarEventDto.start);
    }

    if (updateCalendarEventDto.end !== undefined) {
      updateData.end = new Date(updateCalendarEventDto.end);
    }

    if (updateCalendarEventDto.color !== undefined) {
      updateData.color = updateCalendarEventDto.color;
    }

    if (updateCalendarEventDto.clientName !== undefined) {
      updateData.clientName = updateCalendarEventDto.clientName;
    }

    if (updateCalendarEventDto.isAllDay !== undefined) {
      updateData.isAllDay = updateCalendarEventDto.isAllDay;
    }

    return this.prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a calendar event
   * @param id Event ID
   * @returns Deleted calendar event
   */
  async deleteCalendarEvent(id: string): Promise<CalendarEvent> {
    // Check if event exists
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${id} not found`);
    }

    return this.prisma.calendarEvent.delete({
      where: { id },
    });
  }
}
