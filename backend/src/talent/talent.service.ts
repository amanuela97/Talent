import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MediaType, Talent, Role, Media } from '@prisma/client';

interface MediaFiles {
  images: Express.Multer.File[];
  videos: Express.Multer.File[];
  audios: Express.Multer.File[];
}

@Injectable()
export class TalentService {
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
    mediaFiles: MediaFiles,
  ): Promise<Talent & { media: Media[] }> {
    try {
      // Check if user exists
      const user = await this.prisma.safeQuery(() =>
        this.prisma.user.findUnique({
          where: { userId },
        }),
      );

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user already has a talent profile
      const existingTalent = await this.prisma.safeQuery(() =>
        this.prisma.talent.findUnique({
          where: { talentId: userId },
        }),
      );

      if (existingTalent) {
        throw new ConflictException(`User already has a talent profile`);
      }

      // Create talent profile with the user ID as talent ID
      const talent = await this.prisma.safeQuery(() =>
        this.prisma.talent.create({
          data: {
            talentId: userId,
            bio: createTalentDto.bio,
            services: createTalentDto.services,
            hourlyRate: createTalentDto.hourlyRate,
            location: createTalentDto.location,
            availability: createTalentDto.availability,
            socialLinks: createTalentDto.socialLinks || {},
          },
          include: {
            media: true,
          },
        }),
      );

      // Update user role to TALENT
      await this.prisma.safeQuery(() =>
        this.prisma.user.update({
          where: { userId },
          data: { role: Role.TALENT },
        }),
      );

      // Upload media files if any are provided
      let uploadedMedia: Media[] = [];
      if (
        mediaFiles.images.length > 0 ||
        mediaFiles.videos.length > 0 ||
        mediaFiles.audios.length > 0
      ) {
        uploadedMedia = await this.processAndUploadMedia(userId, mediaFiles);
      }

      return {
        ...talent,
        media: uploadedMedia,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to create talent profile: ${errorMessage}`,
      );
    }
  }

  /**
   * Update a talent profile with optional media files
   */
  async updateWithMedia(
    talentId: string,
    updateTalentDto: UpdateTalentDto,
    mediaFiles: MediaFiles | null,
  ) {
    // Check if talent exists
    const existingTalent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId },
        include: { media: true },
      }),
    );

    if (!existingTalent) {
      throw new NotFoundException(`Talent with ID ${talentId} not found`);
    }

    // First, handle media removals if any
    if (updateTalentDto.mediasToRemove?.length) {
      // Delete from Cloudinary first
      for (const media of updateTalentDto.mediasToRemove) {
        if (media.publicId) {
          await this.cloudinaryService.deleteFile(media.publicId);
        }
      }

      // Then delete from database
      await this.prisma.safeQuery(() =>
        this.prisma.media.deleteMany({
          where: {
            id: {
              in: (updateTalentDto.mediasToRemove ?? []).map(
                (media) => media.id,
              ),
            },
          },
        }),
      );
    }

    // Update talent profile
    const updatedTalent = await this.prisma.safeQuery(() =>
      this.prisma.talent.update({
        where: { talentId },
        data: {
          bio:
            updateTalentDto.bio !== undefined ? updateTalentDto.bio : undefined,
          services:
            updateTalentDto.services !== undefined
              ? updateTalentDto.services
              : undefined,
          hourlyRate:
            updateTalentDto.hourlyRate !== undefined
              ? updateTalentDto.hourlyRate
              : undefined,
          location:
            updateTalentDto.location !== undefined
              ? updateTalentDto.location
              : undefined,
          availability:
            updateTalentDto.availability !== undefined
              ? updateTalentDto.availability
              : undefined,
          socialLinks:
            updateTalentDto.socialLinks !== undefined
              ? updateTalentDto.socialLinks
              : undefined,
        },
        include: {
          media: true,
        },
      }),
    );

    // If media files provided, upload them
    if (mediaFiles) {
      const newMedia = await this.processAndUploadMedia(talentId, mediaFiles);
      updatedTalent.media = [...updatedTalent.media, ...newMedia];
    }

    return updatedTalent;
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
    location?: string;
    minRating?: number;
  }) {
    const {
      skip = 0,
      take = 10,
      services,
      minHourlyRate,
      maxHourlyRate,
      location,
      minRating,
    } = params;

    // Build where conditions based on filters
    const where: {
      services?: { hasSome: string[] };
      hourlyRate?: { gte?: number; lte?: number };
      location?: { contains: string; mode: 'insensitive' };
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

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
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
          location: updateTalentDto.location,
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
}
