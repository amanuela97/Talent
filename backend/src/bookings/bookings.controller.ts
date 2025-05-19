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
  ForbiddenException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role, BookingStatus } from '@prisma/client';
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
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  @ApiResponse({ status: 403, description: 'Talent cannot book themselves' })
  @ApiResponse({ status: 404, description: 'Talent not found' })
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Only customers and admins can create bookings
    if (req.user.role === Role.TALENT) {
      throw new ForbiddenException('Talents cannot create bookings');
    }

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
  @ApiResponse({
    status: 403,
    description: 'Unauthorized to view this booking',
  })
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
  @Roles(Role.TALENT, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Talent or Admin only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({ type: UpdateBookingStatusDto })
  @ApiResponse({ status: 200, description: 'Booking status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized to update this booking',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const validStatuses = [
      BookingStatus.PENDING,
      BookingStatus.ACCEPTED,
      BookingStatus.REJECTED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ];

    if (!validStatuses.includes(updateStatusDto.status)) {
      throw new BadRequestException('Invalid booking status');
    }

    // Only allow talent to update their own bookings unless admin
    if (req.user.role === Role.TALENT) {
      const booking = await this.bookingsService.getBookingById(
        id,
        req.user.userId,
        req.user.role,
      );
      if (booking.talentId !== req.user.userId) {
        throw new ForbiddenException('You can only update your own bookings');
      }
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
      throw new ForbiddenException('You can only view your own bookings');
    }

    return this.bookingsService.getTalentBookings(talentId, status);
  }

  @Get('customer/:customerId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get bookings for a specific customer (Customer or Admin only)',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by booking status',
    enum: Object.values(BookingStatus),
  })
  @ApiResponse({ status: 200, description: 'Returns list of bookings' })
  @ApiResponse({ status: 403, description: 'Unauthorized' })
  async getCustomerBookings(
    @Param('customerId') customerId: string,
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: BookingStatus,
  ) {
    // For customers, verify they are requesting their own bookings
    if (req.user.role === Role.CUSTOMER && req.user.userId !== customerId) {
      throw new ForbiddenException('You can only view your own bookings');
    }

    return this.bookingsService.getClientBookings(customerId, { status });
  }
}
