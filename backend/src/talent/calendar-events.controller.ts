import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TalentService } from './talent.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Controller('calendar-events')
export class CalendarEventsController {
  constructor(private readonly talentService: TalentService) {}

  @Post(':talentId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.TALENT, Role.ADMIN)
  async create(
    @Param('talentId') talentId: string,
    @Body() createCalendarEventDto: CreateCalendarEventDto,
    @Request() req: { user: { role: Role; userId: string } },
  ) {
    // For talents, verify they own this profile
    console.log(req.user.userId, talentId);
    if (req.user.role === Role.TALENT && req.user.userId !== talentId) {
      return { message: 'Unauthorized', statusCode: 403 };
    }

    return this.talentService.createCalendarEvent(
      talentId,
      createCalendarEventDto,
    );
  }

  @Get('event/:id')
  async findOne(@Param('id') id: string) {
    return this.talentService.getCalendarEvent(id);
  }

  @Get(':talentId')
  async findAll(
    @Param('talentId') talentId: string,
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ) {
    return this.talentService.getCalendarEvents(talentId, startDate, endDate);
  }

  @Patch('event/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.TALENT, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCalendarEventDto: UpdateCalendarEventDto,
    @Request() req: { user: { role: Role; userId: string } },
  ) {
    // Get the event to check ownership
    const event = await this.talentService.getCalendarEvent(id);

    if (!event) {
      return { message: 'Event not found', statusCode: 404 };
    }

    // For talents, verify they own this event
    if (req.user.role === Role.TALENT && req.user.userId !== event.talentId) {
      return { message: 'Unauthorized', statusCode: 403 };
    }

    return this.talentService.updateCalendarEvent(id, updateCalendarEventDto);
  }

  @Delete('event/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.TALENT, Role.ADMIN)
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { role: Role; userId: string } },
  ) {
    // Get the event to check ownership
    const event = await this.talentService.getCalendarEvent(id);

    if (!event) {
      return { message: 'Event not found', statusCode: 404 };
    }

    // For talents, verify they own this event
    if (req.user.role === Role.TALENT && req.user.userId !== event.talentId) {
      return { message: 'Unauthorized', statusCode: 403 };
    }

    return this.talentService.deleteCalendarEvent(id);
  }
}
