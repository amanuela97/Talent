/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import {
  FileInterceptor,
  AnyFilesInterceptor,
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

@ApiTags('Talents')
@Controller('talents')
export class TalentController {
  constructor(private readonly talentService: TalentService) {}

  @Post('profile/:userId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
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
        bio: { type: 'string' },
        services: {
          type: 'array',
          items: { type: 'string' },
        },
        hourlyRate: { type: 'number' },
        location: { type: 'string' },
        availability: { type: 'object' },
        socialLinks: { type: 'object' },
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
      required: ['bio', 'services', 'hourlyRate', 'location', 'availability'],
    },
  })
  async create(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createTalentDto: CreateTalentDto,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      audios?: Express.Multer.File[];
    },
  ) {
    const talentData: CreateTalentDto = {
      bio: createTalentDto.bio,
      services: Array.isArray(createTalentDto.services)
        ? createTalentDto.services
        : JSON.parse(createTalentDto.services || '[]'),
      hourlyRate: parseFloat(createTalentDto.hourlyRate.toString()),
      location: createTalentDto.location,
      availability:
        typeof createTalentDto.availability === 'object'
          ? createTalentDto.availability
          : JSON.parse(createTalentDto.availability || '{}'),
      socialLinks:
        typeof createTalentDto.socialLinks === 'object'
          ? createTalentDto.socialLinks
          : JSON.parse(createTalentDto.socialLinks || '{}'),
    };

    const mediaFiles = {
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
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Filter by minimum rating',
  })
  @ApiResponse({ status: 200, description: 'List of talent profiles' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('services') services?: string,
    @Query('minHourlyRate') minHourlyRate?: string,
    @Query('maxHourlyRate') maxHourlyRate?: string,
    @Query('location') location?: string,
    @Query('minRating') minRating?: string,
  ) {
    return this.talentService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      services: services ? services.split(',') : undefined,
      minHourlyRate: minHourlyRate ? parseFloat(minHourlyRate) : undefined,
      maxHourlyRate: maxHourlyRate ? parseFloat(maxHourlyRate) : undefined,
      location,
      minRating: minRating ? parseFloat(minRating) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get talent profile by ID' })
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiResponse({ status: 200, description: 'Talent profile found' })
  @ApiResponse({ status: 404, description: 'Talent profile not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.talentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
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
        bio: { type: 'string' },
        services: {
          type: 'array',
          items: { type: 'string' },
        },
        hourlyRate: { type: 'number' },
        location: { type: 'string' },
        availability: { type: 'object' },
        socialLinks: { type: 'object' },
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
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
      audios?: Express.Multer.File[];
    },
  ) {
    const talentData: UpdateTalentDto = {};

    if (updateTalentDto.bio) talentData.bio = updateTalentDto.bio;

    if (updateTalentDto.services) {
      talentData.services = Array.isArray(updateTalentDto.services)
        ? updateTalentDto.services
        : JSON.parse(updateTalentDto.services);
    }

    if (updateTalentDto.mediasToRemove) {
      talentData.mediasToRemove = Array.isArray(updateTalentDto.mediasToRemove)
        ? updateTalentDto.mediasToRemove
        : JSON.parse(updateTalentDto.mediasToRemove);
    }

    if (updateTalentDto.hourlyRate) {
      talentData.hourlyRate = parseFloat(updateTalentDto.hourlyRate.toString());
    }

    if (updateTalentDto.location)
      talentData.location = updateTalentDto.location;

    if (updateTalentDto.availability) {
      talentData.availability =
        typeof updateTalentDto.availability === 'object'
          ? updateTalentDto.availability
          : JSON.parse(updateTalentDto.availability);
    }

    if (updateTalentDto.socialLinks) {
      talentData.socialLinks =
        typeof updateTalentDto.socialLinks === 'object'
          ? updateTalentDto.socialLinks
          : JSON.parse(updateTalentDto.socialLinks);
    }

    const mediaFiles = {
      images: files?.images || [],
      videos: files?.videos || [],
      audios: files?.audios || [],
    };

    const hasFiles =
      mediaFiles.images.length > 0 ||
      mediaFiles.videos.length > 0 ||
      mediaFiles.audios.length > 0;

    return this.talentService.updateWithMedia(
      id,
      talentData,
      hasFiles ? mediaFiles : null,
    );
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
    return this.talentService.remove(id, req?.user?.email);
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
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Upload multiple media files for talent portfolio' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Talent ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
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
    @UploadedFiles() files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    const mediaFiles = {
      images: files.images || [],
      videos: files.videos || [],
      audios: files.audios || [],
    };

    return this.talentService.addMultipleMedia(id, mediaFiles);
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

  @Get('search/by-location')
  @ApiOperation({ summary: 'Search talents by location' })
  @ApiQuery({ name: 'location', required: true, description: 'Location name' })
  @ApiResponse({ status: 200, description: 'List of talents in the location' })
  async searchByLocation(@Query('location') location: string) {
    return this.talentService.findAll({
      location,
    });
  }
}
