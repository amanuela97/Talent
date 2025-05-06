import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MediaType, Talent, Role, Media, Prisma } from '@prisma/client';

interface MediaFiles {
  images: Express.Multer.File[];
  videos: Express.Multer.File[];
  audios: Express.Multer.File[];
}

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
  ) {}

  /**
   * Create a new talent profile with media files
   */
  async createWithMedia(
    userId: string,
    createTalentDto: CreateTalentDto,
    files: {
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

    // Create talent profile first
    const talent = await this.prisma.talent.create({
      data: {
        talentId: userId,
        firsName: createTalentDto.firsName,
        lastName: createTalentDto.lastName,
        generalCategory: createTalentDto.generalCategory,
        specificCategory: createTalentDto.specificCategory,
        ServiceName: createTalentDto.ServiceName,
        address: createTalentDto.address,
        phoneNumber: createTalentDto.phoneNumber,
        status: createTalentDto.status, // Let Prisma use the default
        isEmailVerified: createTalentDto.isEmailVerified, // Prisma will use default if undefined
        verificationToken:
          createTalentDto.verificationToken || crypto.randomUUID(),
        // Optional fields - let Prisma use defaults if undefined
        languagesSpoken: createTalentDto.languagesSpoken,
        bio: createTalentDto.bio,
        services: createTalentDto.services,
        hourlyRate: createTalentDto.hourlyRate,
        city: createTalentDto.city,
        availability: createTalentDto.availability,
        socialLinks: createTalentDto.socialLinks,
        isOnline: createTalentDto.isOnline, // Prisma will use default if undefined
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
    const updateData: Prisma.TalentUpdateInput = {};

    if (updateTalentDto.firsName !== undefined)
      updateData.firsName = updateTalentDto.firsName;

    if (updateTalentDto.lastName !== undefined)
      updateData.lastName = updateTalentDto.lastName;

    if (updateTalentDto.generalCategory !== undefined)
      updateData.generalCategory = updateTalentDto.generalCategory;

    if (updateTalentDto.specificCategory !== undefined)
      updateData.specificCategory = updateTalentDto.specificCategory;

    if (updateTalentDto.ServiceName !== undefined)
      updateData.ServiceName = updateTalentDto.ServiceName;

    if (updateTalentDto.address !== undefined)
      updateData.address = updateTalentDto.address;

    if (updateTalentDto.phoneNumber !== undefined)
      updateData.phoneNumber = updateTalentDto.phoneNumber;

    if (updateTalentDto.status !== undefined)
      if (typeof updateTalentDto.status === 'string') {
        updateData.status = updateTalentDto.status;
      }

    if (updateTalentDto.isEmailVerified !== undefined)
      updateData.isEmailVerified = updateTalentDto.isEmailVerified;

    if (updateTalentDto.verificationToken !== undefined)
      updateData.verificationToken = updateTalentDto.verificationToken;

    if (updateTalentDto.isOnline !== undefined)
      updateData.isOnline = updateTalentDto.isOnline;

    if (updateTalentDto.languagesSpoken !== undefined)
      updateData.languagesSpoken = updateTalentDto.languagesSpoken;

    if (updateTalentDto.bio !== undefined) updateData.bio = updateTalentDto.bio;

    if (updateTalentDto.services !== undefined)
      updateData.services = updateTalentDto.services;

    if (updateTalentDto.hourlyRate !== undefined)
      updateData.hourlyRate = updateTalentDto.hourlyRate;

    if (updateTalentDto.city !== undefined)
      updateData.city = updateTalentDto.city;

    if (updateTalentDto.availability !== undefined)
      updateData.availability = updateTalentDto.availability;

    if (updateTalentDto.socialLinks !== undefined)
      updateData.socialLinks = updateTalentDto.socialLinks;

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
  ): Promise<Media[]> {
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

    // Process and upload the media files
    return this.processAndUploadMedia(talentId, mediaFiles);
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
  }) {
    const {
      skip = 0,
      take = 10,
      services,
      minHourlyRate,
      maxHourlyRate,
      city, // Changed from location to city
      minRating,
    } = params;

    // Build where conditions based on filters
    const where: {
      services?: { hasSome: string[] };
      hourlyRate?: { gte?: number; lte?: number };
      city?: { contains: string; mode: 'insensitive' }; // Changed from location to city
      rating?: { gte: number };
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
  }

  /**
   * Find a talent profile by user ID
   */
  async findByUserId(userId: string) {
    const talent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId: userId }, // In your schema, talentId is the userId
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
      throw new NotFoundException(`Talent with user ID ${userId} not found`);
    }

    return talent;
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
        data: {
          bio: updateTalentDto.bio,
          services: updateTalentDto.services,
          hourlyRate: updateTalentDto.hourlyRate,
          city: updateTalentDto.city, // Changed from location to city
          availability: updateTalentDto.availability,
          socialLinks: updateTalentDto.socialLinks,
        },
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
      await this.cloudinaryService.deleteFile(publicId);
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
}
