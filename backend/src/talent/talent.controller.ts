import { TalentStatus } from '@prisma/client';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { TalentService } from './talent.service';
import { CreateTalentDto } from './dto/create-talent.dto';
import { UpdateTalentDto } from './dto/update-talent.dto';
import { MediaType } from '@prisma/client';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from 'src/backendTypes';
import { isBoolean, isString } from 'class-validator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Talents')
@Controller('talents')
export class TalentController {
  constructor(private readonly talentService: TalentService) { }

  @Post('profile/:userId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'images', maxCount: 10 },
      { name: 'videos', maxCount: 5 },
      { name: 'audios', maxCount: 5 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new talent profile for a user with media files',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 201,
    description: 'Talent profile created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 409,
    description: 'User already has a talent profile',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        generalCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of general category IDs',
        },
        specificCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of specific category IDs',
        },
        serviceName: { type: 'string' },
        address: { type: 'string' },
        phoneNumber: { type: 'string' },
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
          default: 'PENDING',
        },
        isEmailVerified: { type: 'boolean', default: false },
        verificationToken: { type: 'string' },
        isPublic: { type: 'boolean', default: false },
        languagesSpoken: {
          type: 'array',
          items: { type: 'string' },
        },
        bio: { type: 'string' },
        services: {
          type: 'array',
          items: { type: 'string' },
        },
        hourlyRate: { type: 'number' },
        city: { type: 'string' },
        availability: { type: 'object' },
        socialLinks: { type: 'object' },
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        videos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        audios: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: [
        'firstName',
        'lastName',
        'email',
        'generalCategories',
        'specificCategories',
        'serviceName',
        'address',
        'phoneNumber',
        'verificationToken',
        'profilePicture',
      ],
    },
  })
  async create(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createTalentDto: CreateTalentDto,
    @UploadedFiles()
    files: {
      profilePicture?: Express.Multer.File[];
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      audios?: Express.Multer.File[];
    },
  ) {
    // Validate that profile picture is provided
    if (!files.profilePicture || files.profilePicture.length === 0) {
      throw new BadRequestException('Profile picture is required');
    }

    // Validate that categories are provided
    if (!createTalentDto.generalCategories || createTalentDto.generalCategories.length === 0) {
      throw new BadRequestException('At least one general category is required');
    }

    if (!createTalentDto.specificCategories || createTalentDto.specificCategories.length === 0) {
      throw new BadRequestException('At least one specific category is required');
    }

    const talentData: CreateTalentDto = {
      firstName: createTalentDto.firstName,
      lastName: createTalentDto.lastName,
      email: createTalentDto.email,
      generalCategories: createTalentDto.generalCategories,
      specificCategories: createTalentDto.specificCategories,
      serviceName: createTalentDto.serviceName,
      address: createTalentDto.address,
      phoneNumber: createTalentDto.phoneNumber,
      status:
        createTalentDto.status &&
          Object.values(TalentStatus).includes(createTalentDto.status)
          ? createTalentDto.status
          : undefined,
      isEmailVerified: isBoolean(createTalentDto.isEmailVerified)
        ? createTalentDto.isEmailVerified
        : undefined,
      verificationToken:
        createTalentDto.verificationToken || crypto.randomUUID(),
      isPublic: createTalentDto.isPublic,
      languagesSpoken: createTalentDto.languagesSpoken,
      bio: createTalentDto.bio,
      services: createTalentDto.services,
      hourlyRate: createTalentDto.hourlyRate,
      city: createTalentDto.city,
      availability: createTalentDto.availability,
      socialLinks: createTalentDto.socialLinks,
      isOnline: createTalentDto.isOnline,
    };

    const mediaFiles = {
      profilePicture: files.profilePicture[0],
      images: files.images || [],
      videos: files.videos || [],
      audios: files.audios || [],
    };

    return await this.talentService.createWithMedia(
      userId,
      talentData,
      mediaFiles,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all talent profiles with filtering and pagination',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of records to take',
  })
  @ApiQuery({
    name: 'services',
    required: false,
    description: 'Filter by services (comma separated)',
  })
  @ApiQuery({
    name: 'minHourlyRate',
    required: false,
    description: 'Filter by minimum hourly rate',
  })
  @ApiQuery({
    name: 'maxHourlyRate',
    required: false,
    description: 'Filter by maximum hourly rate',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Filter by city',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Filter by minimum rating',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by talent name, services, or general category',
  })
  @ApiQuery({
    name: 'generalCategory',
    required: false,
    description: 'Filter by general category',
  })
  @ApiQuery({
    name: 'languages',
    required: false,
    description: 'Filter by languages (comma separated)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc or desc)',
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    description: 'Filter by public status',
  })
  @ApiResponse({ status: 200, description: 'List of talent profiles' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('services') services?: string,
    @Query('minHourlyRate') minHourlyRate?: string,
    @Query('maxHourlyRate') maxHourlyRate?: string,
    @Query('city') city?: string,
    @Query('minRating') minRating?: string,
    @Query('search') search?: string,
    @Query('generalCategory') generalCategory?: string,
    @Query('languages') languages?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isPublic') isPublic?: string,
  ) {
    return this.talentService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      services: services ? services.split(',') : undefined,
      minHourlyRate: minHourlyRate ? parseFloat(minHourlyRate) : undefined,
      maxHourlyRate: maxHourlyRate ? parseFloat(maxHourlyRate) : undefined,
      city,
      minRating: minRating ? parseFloat(minRating) : undefined,
      search,
      generalCategory,
      languages: languages ? languages.split(',') : undefined,
      sortBy,
      sortOrder,
      isPublic: isPublic === 'true', // Convert string to boolean
    });
  }
  @Get('service/:serviceName')
  @ApiOperation({ summary: 'Get talent profile by service name' })
  @ApiParam({
    name: 'serviceName',
    description: 'Talent service name (slugified)',
  })
  @ApiResponse({ status: 200, description: 'Talent profile found' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  async findByServiceName(@Param('serviceName') serviceName: string) {
    return this.talentService.findByServiceName(serviceName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get talent profile by ID' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiResponse({ status: 200, description: 'Talent profile found' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.talentService.findOne(id);
  }
  @Get('user/:userId')
  @ApiOperation({ summary: 'Find talent by user ID' })
  @ApiParam({ name: 'userId', type: 'string', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Talent found' })
  @ApiResponse({ status: 404, description: 'Talent not found' })
  async findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.talentService.findByUserId(userId);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'images', maxCount: 10 },
      { name: 'videos', maxCount: 5 },
      { name: 'audios', maxCount: 5 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update talent profile with optional media files' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiResponse({
    status: 200,
    description: 'Talent profile updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        generalCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of general category IDs to assign',
        },
        specificCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of specific category IDs to assign',
        },
        removedCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of category IDs to remove',
        },
        serviceName: { type: 'string' },
        address: { type: 'string' },
        phoneNumber: { type: 'string' },
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
        },
        isEmailVerified: { type: 'boolean' },
        verificationToken: { type: 'string' },
        isOnline: { type: 'boolean' },
        isPublic: { type: 'boolean' },
        languagesSpoken: {
          type: 'array',
          items: { type: 'string' },
        },
        bio: { type: 'string' },
        services: {
          type: 'array',
          items: { type: 'string' },
        },
        hourlyRate: { type: 'number' },
        city: { type: 'string' },
        availability: { type: 'object' },
        socialLinks: { type: 'object' },
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        videos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        audios: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTalentDto: UpdateTalentDto,
    @UploadedFiles()
    files: {
      profilePicture?: Express.Multer.File[];
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      audios?: Express.Multer.File[];
    },
  ) {
    const talentData: UpdateTalentDto = {
      firstName: updateTalentDto.firstName,
      lastName: updateTalentDto.lastName,
      email: updateTalentDto.email,
      generalCategories: updateTalentDto.generalCategories,
      specificCategories: updateTalentDto.specificCategories,
      removedCategories: updateTalentDto.removedCategories,
      serviceName: updateTalentDto.serviceName,
      address: updateTalentDto.address,
      phoneNumber: updateTalentDto.phoneNumber,
      status: updateTalentDto.status,
      isEmailVerified: updateTalentDto.isEmailVerified,
      verificationToken: updateTalentDto.verificationToken,
      isOnline: updateTalentDto.isOnline,
      isPublic: updateTalentDto.isPublic,
      languagesSpoken: updateTalentDto.languagesSpoken,
      bio: updateTalentDto.bio,
      services: updateTalentDto.services,
      hourlyRate: updateTalentDto.hourlyRate,
      city: updateTalentDto.city,
      availability: updateTalentDto.availability,
      socialLinks: updateTalentDto.socialLinks,
    };

    const mediaFiles = {
      profilePicture: files?.profilePicture?.[0],
      images: files?.images || [],
      videos: files?.videos || [],
      audios: files?.audios || [],
    };

    return this.talentService.updateWithMedia(id, talentData, mediaFiles);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete talent profile' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiResponse({
    status: 200,
    description: 'Talent profile deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.talentService.remove(id, req?.user?.userId);
  }

  @Post(':id/media')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload media file for talent portfolio' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO', 'AUDIO'],
        },
        description: {
          type: 'string',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or media type' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  async uploadMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: '.(png|jpeg|jpg|mp4|mp3|mpeg|wav|webp|gif)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('type') mediaType: string,
    @Body('description') description?: string,
  ) {
    if (!Object.values(MediaType).includes(mediaType as MediaType)) {
      throw new BadRequestException(
        `Invalid media type. Must be one of: ${Object.values(MediaType).join(', ')}`,
      );
    }

    return this.talentService.addMedia(
      id,
      file,
      mediaType as MediaType,
      description,
    );
  }

  @Post(':id/media/bulk')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profilePicture', maxCount: 1 },
      { name: 'images', maxCount: 10 },
      { name: 'videos', maxCount: 4 },
      { name: 'audios', maxCount: 10 },
    ]),
  )
  @ApiOperation({ summary: 'Upload multiple media files for talent portfolio' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        videos: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        audios: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media files uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid files' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  async uploadMultipleMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles()
    files: {
      profilePicture?: Express.Multer.File[];
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      audios?: Express.Multer.File[];
    },
  ) {
    const mediaFiles = {
      profilePicture: files.profilePicture?.[0],
      images: files.images || [],
      videos: files.videos || [],
      audios: files.audios || [],
    };

    console.log('Processed mediaFiles:', {
      profilePicture: mediaFiles.profilePicture
        ? mediaFiles.profilePicture.originalname
        : 'none',
      images: mediaFiles.images.length,
      videos: mediaFiles.videos.length,
      audios: mediaFiles.audios.length,
    });

    // Check if profile picture is present
    if (mediaFiles.profilePicture) {
      // Update profile picture separately
      await this.talentService.updateProfilePicture(
        id,
        mediaFiles.profilePicture,
      );
    }

    // Check if there are any other media files to process
    const hasFiles =
      mediaFiles.images.length > 0 ||
      mediaFiles.videos.length > 0 ||
      mediaFiles.audios.length > 0;

    if (!hasFiles) {
      if (mediaFiles.profilePicture) {
        // If we only updated the profile picture but no other media,
        // return success instead of trying to add other media
        return {
          success: true,
          message: 'Profile picture updated successfully',
        };
      }
      throw new BadRequestException('No media files provided');
    }

    // Process other media files
    return this.talentService.addMultipleMedia(id, {
      images: mediaFiles.images,
      videos: mediaFiles.videos,
      audios: mediaFiles.audios,
    });
  }

  @Delete('media/:mediaId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove media from talent portfolio' })
  @ApiParam({ name: 'mediaId', description: 'Media ID' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async removeMedia(@Param('mediaId') mediaId: string) {
    return this.talentService.removeMedia(mediaId);
  }
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get reviews for a talent profile' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number, starting from 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of reviews per page',
  })
  @ApiResponse({ status: 200, description: 'Reviews found' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  async getTalentReviews(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '5',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.talentService.getTalentReviews(id, pageNum, limitNum);
  }

  @Post(':id/review')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a review for a talent' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rating: { type: 'number', minimum: 1, maximum: 5 },
        comment: { type: 'string' },
      },
      required: ['rating', 'comment'],
    },
  })
  @ApiResponse({ status: 201, description: 'Review added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating or comment' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  async addReview(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    if (!comment || comment.trim().length === 0) {
      throw new BadRequestException('Comment is required');
    }

    if (!req.user || !req.user.userId) {
      throw new BadRequestException('User information is missing');
    }
    return this.talentService.addReview(id, req.user.userId, rating, comment);
  }

  @Get(':id/media')
  @ApiOperation({ summary: 'Get all media for a talent profile' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiResponse({ status: 200, description: 'List of media' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  async getTalentMedia(@Param('id', ParseUUIDPipe) id: string) {
    const talent = await this.talentService.findOne(id);
    if (!Array.isArray(talent.media)) {
      throw new BadRequestException('Invalid media format');
    }

    return (
      talent.media as {
        id: string;
        type: string;
        url: string;
        description?: string;
      }[]
    ).map((media) => ({
      id: media.id,
      type: media.type,
      url: media.url,
      description: media?.description || '',
    }));
  }

  @Get('search/by-service')
  @ApiOperation({ summary: 'Search talents by service' })
  @ApiQuery({ name: 'service', required: true, description: 'Service name' })
  @ApiResponse({
    status: 200,
    description: 'List of talents offering the service',
  })
  async searchByService(@Query('service') service: string) {
    return this.talentService.findAll({
      services: [service],
    });
  }

  @Get('search/by-city')
  @ApiOperation({ summary: 'Search talents by city' })
  @ApiQuery({ name: 'city', required: true, description: 'City name' })
  @ApiResponse({ status: 200, description: 'List of talents in the city' })
  async searchByCity(@Query('city') city: string) {
    return this.talentService.findAll({
      city,
    });
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify talent email with token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
      },
      required: ['token'],
    },
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'Invalid verification token' })
  async verifyEmail(@Body('token') token: string) {
    return this.talentService.verifyEmail(token);
  }

  @Get('admin/pending')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all talents with pending status (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pending talents' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getPendingTalents() {
    try {
      return await this.talentService.findAll({
        status: 'PENDING',
        isEmailVerified: true,
      });
    } catch (error) {
      // Log the error for debugging
      console.error('Error fetching pending talents:', error);

      // Rethrow to let the exception filters handle it
      throw error;
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update talent status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
        },
        rejectionReason: {
          type: 'string',
          description:
            'Reason for rejection (required when status is REJECTED)',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Talent status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Talent not found' })
  async updateTalentStatus(
    @Param('id') id: string,
    @Body('status') status: 'PENDING' | 'APPROVED' | 'REJECTED',
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.talentService.updateStatus(id, status, rejectionReason);
  }
}
