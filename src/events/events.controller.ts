import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Request } from 'express';

interface UserRequest extends Request {
  user: {
    userId: number;
    username: string;
  };
}

@ApiTags('events')
@Controller('habitat/:habitatId/events')
@UseGuards(JwtGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventsService.create(
      +habitatId,
      req.user.userId,
      createEventDto,
    );
  }

  @Get()
  findAll(@Req() req: UserRequest, @Param('habitatId') habitatId: string) {
    return this.eventsService.findAll(+habitatId, req.user.userId);
  }

  @Get(':id')
  findOne(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Param('id') id: string,
  ) {
    return this.eventsService.findOne(+habitatId, req.user.userId, +id);
  }

  @Patch(':id')
  update(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(
      +habitatId,
      req.user.userId,
      +id,
      updateEventDto,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Param('id') id: string,
  ) {
    return this.eventsService.remove(+habitatId, req.user.userId, +id);
  }
}