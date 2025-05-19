/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BookingStatus } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: Role;
  };
}

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        talentId: { type: 'string' },
        eventDate: { type: 'string', format: 'date-time' },
        eventType: { type: 'string' },
        duration: { type: 'number' },
        location: { type: 'string' },
        comments: { type: 'string' },
      },
      required: ['talentId', 'eventDate', 'eventType', 'duration', 'location'],
    },
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  @ApiResponse({ status: 404, description: 'Talent not found' })
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      return await this.bookingsService.createBooking(
        createBookingDto,
        req.user.userId,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Failed to create booking');
    }
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings for the authenticated user' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by booking status',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    enum: Object.values(BookingStatus),
  })
  @ApiResponse({ status: 200, description: 'Returns list of bookings' })
  async getUserBookings(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: BookingStatus,
  ) {
    return await this.bookingsService.getUserBookings(
      req.user.userId,
      req.user.role,
      status,
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Returns booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingsService.getBookingById(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.TALENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Talent only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            BookingStatus.ACCEPTED,
            BookingStatus.REJECTED,
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
          ],
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Booking status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const validStatuses = [
      BookingStatus.ACCEPTED,
      BookingStatus.REJECTED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
      BookingStatus.PENDING,
    ];

    if (!validStatuses.includes(updateStatusDto.status)) {
      throw new BadRequestException('Invalid booking status');
    }

    return this.bookingsService.updateBookingStatus(
      id,
      updateStatusDto.status,
      req.user.userId,
    );
  }

  @Get('talent/:talentId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.TALENT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bookings for a specific talent (Talent or Admin only)',
  })
  @ApiParam({ name: 'talentId', description: 'Talent ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by booking status',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    enum: Object.values(BookingStatus),
  })
  @ApiResponse({ status: 200, description: 'Returns list of bookings' })
  @ApiResponse({ status: 403, description: 'Unauthorized' })
  async getTalentBookings(
    @Param('talentId') talentId: string,
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: BookingStatus,
  ) {
    // For talents, verify they are requesting their own bookings
    if (req.user.role === Role.TALENT && req.user.userId !== talentId) {
      throw new BadRequestException('You can only view your own bookings');
    }

    return this.bookingsService.getTalentBookings(talentId, status);
  }
}
