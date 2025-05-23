/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Role, Prisma, BookingStatus, EventBooking } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Create a new booking request
   */
  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    // Check if talent exists
    const talent = await this.prisma.safeQuery(() =>
      this.prisma.talent.findUnique({
        where: { talentId: createBookingDto.talentId },
        select: {
          talentId: true,
          firstName: true,
          lastName: true,
          email: true,
          hourlyRate: true,
          serviceName: true,
        },
      }),
    );

    if (!talent) {
      throw new NotFoundException(
        `Talent with ID ${createBookingDto.talentId} not found`,
      );
    }

    // Check if user exists and get their role
    const user = await this.prisma.safeQuery(() =>
      this.prisma.user.findUnique({
        where: { userId },
        select: {
          userId: true,
          name: true,
          email: true,
          role: true,
        },
      }),
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prevent talents from booking themselves
    if (
      user.role === Role.TALENT &&
      user.userId === createBookingDto.talentId
    ) {
      throw new ForbiddenException('Talents cannot book themselves');
    }

    try {
      // Calculate booking details
      const startDate = new Date(createBookingDto.eventDate);
      const [hours, minutes] = createBookingDto.eventTime
        .split(':')
        .map(Number);
      startDate.setHours(hours, minutes);

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + createBookingDto.duration);

      // Create booking
      const booking = await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.create({
          data: {
            clientId: userId,
            talentId: createBookingDto.talentId,
            eventTime: createBookingDto.eventTime,
            eventDate: createBookingDto.eventDate,
            eventType: createBookingDto.eventType,
            equipmentNeeded: createBookingDto.equipmentNeeded,
            duration: createBookingDto.duration,
            location: createBookingDto.location,
            guestCount: createBookingDto.guestCount,
            serviceRequirements: createBookingDto.serviceRequirements,
            additionalComments: createBookingDto.additionalComments,
            budgetAmount: createBookingDto.budgetAmount,
            budgetRange: createBookingDto.budgetRange,
            status: 'PENDING',
          },
          include: {
            client: {
              select: {
                name: true,
                email: true,
              },
            },
            talent: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                serviceName: true,
              },
            },
          },
        }),
      );

      // Create calendar event for talent (marked as BOOKED but requires confirmation)
      await this.prisma.safeQuery(() =>
        this.prisma.calendarEvent.create({
          data: {
            talentId: createBookingDto.talentId,
            type: 'BOOKED',
            title: `Booking: ${createBookingDto.eventType} (Pending)`,
            start: startDate,
            end: endDate,
            clientName: user.name,
            color: '#3b82f6', // blue (use the color from your existing calendar component)
            isAllDay: false,
          },
        }),
      );

      // Send email notification to talent
      if (!talent.email) {
        throw new BadRequestException('Talent email is missing');
      }
      await this.mailService.sendBookingRequestToTalent(talent.email, {
        talentName: `${talent.firstName} ${talent.lastName}`,
        clientName: user.name,
        eventType: createBookingDto.eventType,
        eventDate: startDate.toLocaleDateString(),
        eventTime: startDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        duration: createBookingDto.duration,
        location: createBookingDto.location,
        totalPrice: (talent.hourlyRate ?? 0) * createBookingDto.duration,
      });

      // Send confirmation email to client
      await this.mailService.sendBookingConfirmationToClient(user.email, {
        clientName: user.name,
        talentName: `${talent.firstName} ${talent.lastName}`,
        serviceName: talent.serviceName,
        eventType: createBookingDto.eventType,
        eventDate: startDate.toLocaleDateString(),
        eventTime: startDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        duration: createBookingDto.duration,
        location: createBookingDto.location,
        totalPrice: (talent.hourlyRate ?? 0) * createBookingDto.duration,
      });

      return booking;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException('Invalid booking data');
      }
      throw error;
    }
  }

  /**
   * Get bookings for a user (different behavior based on role)
   */
  async getUserBookings(userId: string, role: Role, status?: BookingStatus) {
    const whereClause: Prisma.EventBookingWhereInput = {};

    // For talents, get bookings where they are the talent
    if (role === Role.TALENT) {
      whereClause.talentId = userId;
    } else {
      // For regular users, get bookings they've made
      whereClause.clientId = userId;
    }

    if (
      status &&
      (typeof status !== 'string' ||
        !Object.values(BookingStatus).includes(status))
    ) {
      throw new BadRequestException('Invalid booking status');
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const bookings = await this.prisma.safeQuery(() =>
      this.prisma.eventBooking.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          talent: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              serviceName: true,
              talentProfilePicture: true,
            },
          },
        },
      }),
    );

    return bookings;
  }

  /**
   * Get booking details by ID
   */
  async getBookingById(bookingId: string, userId: string, role: Role) {
    const booking = await this.prisma.safeQuery(() =>
      this.prisma.eventBooking.findUnique({
        where: { bookingId },
        include: {
          client: {
            select: {
              userId: true,
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          talent: {
            select: {
              talentId: true,
              firstName: true,
              lastName: true,
              email: true,
              serviceName: true,
              talentProfilePicture: true,
              hourlyRate: true,
            },
          },
        },
      }),
    );

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Check permissions
    if (
      role !== Role.ADMIN &&
      booking.clientId !== userId &&
      booking.talentId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this booking',
      );
    }

    return booking;
  }

  /**
   * Update booking status (Talent only)
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    talentId: string,
  ) {
    // Find the booking
    const booking = await this.prisma.safeQuery(() =>
      this.prisma.eventBooking.findUnique({
        where: { bookingId },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          talent: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              serviceName: true,
            },
          },
        },
      }),
    );

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Verify talent owns this booking
    if (booking.talentId !== talentId) {
      throw new ForbiddenException(
        'You do not have permission to update this booking',
      );
    }

    if (
      typeof status !== 'string' ||
      !Object.values(BookingStatus).includes(status)
    ) {
      throw new BadRequestException('Invalid booking status');
    }

    // Update booking status
    const updatedBooking = await this.prisma.safeQuery(() =>
      this.prisma.eventBooking.update({
        where: { bookingId },
        data: { status: status },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
          talent: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              serviceName: true,
            },
          },
        },
      }),
    );

    // Update calendar event
    try {
      // Find the corresponding calendar event
      const calendarEvent = await this.prisma.safeQuery(() =>
        this.prisma.calendarEvent.findFirst({
          where: {
            talentId,
            start: booking.eventDate
              ? new Date(String(booking.eventDate))
              : new Date(),
            type: 'BOOKED',
          },
        }),
      );

      if (calendarEvent) {
        // Update the event title based on new status
        await this.prisma.safeQuery(() =>
          this.prisma.calendarEvent.update({
            where: { id: calendarEvent.id },
            data: {
              title: `Booking: ${booking.eventType} (${status})`,
            },
          }),
        );

        // If booking is rejected or cancelled, delete the calendar event
        if (status === 'REJECTED' || status === 'CANCELLED') {
          await this.prisma.safeQuery(() =>
            this.prisma.calendarEvent.delete({
              where: { id: calendarEvent.id },
            }),
          );
        }
      }
    } catch (error) {
      console.error('Error updating calendar event:', error);
    }

    // Send notification to client
    try {
      if (status === 'ACCEPTED' && booking.client?.email) {
        await this.mailService.sendBookingAcceptedToClient(
          booking.client?.email,
          {
            clientName: `${booking.client?.name || 'Client'}`,
            talentName: `${booking.talent.firstName || ''} ${booking.talent.lastName || ''}`,
            serviceName: booking.talent.serviceName || '',
            eventType: booking.eventType,
            eventDate: booking.eventDate.toLocaleDateString(),
            eventTime: booking.eventDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            duration: booking.duration,
            location: booking.location,
          },
        );
      } else if (status === 'REJECTED' && booking.client?.email) {
        await this.mailService.sendBookingRejectedToClient(
          booking.client.email,
          {
            clientName: `${booking.client?.name || 'Client'}`,
            talentName: `${booking.talent.firstName} ${booking.talent.lastName}`,
            serviceName: booking.talent.serviceName,
            eventType: booking.eventType,
            eventDate: booking.eventDate.toLocaleDateString(),
          },
        );
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }

    return updatedBooking;
  }

  /**
   * Get bookings for a specific talent
   */
  async getTalentBookings(talentId: string, status?: BookingStatus) {
    // Build where clause
    const whereClause: Prisma.EventBookingWhereInput = { talentId };

    if (
      status &&
      (typeof status !== 'string' ||
        !Object.values(BookingStatus).includes(status))
    ) {
      throw new BadRequestException('Invalid booking status');
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const bookings = await this.prisma.safeQuery(() =>
      this.prisma.eventBooking.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              name: true,
              email: true,
              profilePicture: true,
            },
          },
          talent: {
            select: {
              firstName: true,
              lastName: true,
              serviceName: true,
              talentProfilePicture: true,
            },
          },
        },
      }),
    );

    return bookings;
  }

  async create(
    createBookingDto: CreateBookingDto,
    clientId: string,
  ): Promise<EventBooking> {
    try {
      // Check if talent exists
      const talent = await this.prisma.safeQuery(() =>
        this.prisma.talent.findUnique({
          where: { talentId: createBookingDto.talentId },
        }),
      );

      if (!talent) {
        throw new NotFoundException(
          `Talent with ID ${createBookingDto.talentId} not found`,
        );
      }

      // Check if client exists
      const client = await this.prisma.safeQuery(() =>
        this.prisma.user.findUnique({
          where: { userId: clientId },
        }),
      );

      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }

      // Create the booking
      return await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.create({
          data: {
            clientId: clientId,
            ...createBookingDto,
            status: BookingStatus.PENDING,
          },
          include: {
            talent: true,
            client: true,
          },
        }),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create booking');
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    talentId?: string;
    clientId?: string;
    status?: BookingStatus;
  }): Promise<{ bookings: EventBooking[]; total: number }> {
    const { skip = 0, take = 10, talentId, clientId, status } = params;

    const where = {
      ...(talentId && { talentId }),
      ...(clientId && { clientId }),
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      this.prisma.safeQuery(() =>
        this.prisma.eventBooking.findMany({
          where,
          skip,
          take,
          include: {
            talent: true,
            client: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ),
      this.prisma.safeQuery(() => this.prisma.eventBooking.count({ where })),
    ]);

    return { bookings, total };
  }

  async findOne(id: string): Promise<EventBooking> {
    const booking = await this.prisma.safeQuery(() =>
      this.prisma.eventBooking.findUnique({
        where: { bookingId: id },
        include: {
          talent: true,
          client: true,
        },
      }),
    );

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<EventBooking> {
    try {
      // Check if booking exists
      const booking = await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.findUnique({
          where: { bookingId: id },
        }),
      );

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      // Update the booking
      return await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.update({
          where: { bookingId: id },
          data: updateBookingDto,
          include: {
            talent: true,
            client: true,
          },
        }),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update booking');
    }
  }

  async updateStatus(id: string, status: BookingStatus): Promise<EventBooking> {
    try {
      const booking = await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.findUnique({
          where: { bookingId: id },
        }),
      );

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      return await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.update({
          where: { bookingId: id },
          data: { status },
          include: {
            talent: true,
            client: true,
          },
        }),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update booking status');
    }
  }

  async remove(id: string): Promise<EventBooking> {
    try {
      const booking = await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.findUnique({
          where: { bookingId: id },
        }),
      );

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      return await this.prisma.safeQuery(() =>
        this.prisma.eventBooking.delete({
          where: { bookingId: id },
          include: {
            talent: true,
            client: true,
          },
        }),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete booking');
    }
  }

  async getClientBookings(
    clientId: string,
    params: {
      skip?: number;
      take?: number;
      status?: BookingStatus;
    },
  ): Promise<{ bookings: EventBooking[]; total: number }> {
    return this.findAll({
      ...params,
      clientId,
    });
  }
}
