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
import { HabitatService } from './habitat.service';
import { CreateHabitatDto } from './dto/create-habitat.dto';
import { UpdateHabitatDto } from './dto/update-habitat.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Request } from 'express';

interface UserRequest extends Request {
  user: {
    userId: number;
    username: string;
  };
}

@Controller('habitat')
@UseGuards(JwtGuard)
export class HabitatController {
  constructor(private readonly habitatService: HabitatService) {}

  @Post()
  create(@Req() req: UserRequest, @Body() createHabitatDto: CreateHabitatDto) {
    return this.habitatService.create({
      ...createHabitatDto,
      userId: req.user.userId,
    });
  }

  @Get()
  findAll(@Req() req: UserRequest) {
    return this.habitatService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: UserRequest, @Param('id') id: string) {
    return this.habitatService.findOne(+id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Req() req: UserRequest,
    @Param('id') id: string,
    @Body() updateHabitatDto: UpdateHabitatDto,
  ) {
    return this.habitatService.update(+id, req.user.userId, updateHabitatDto);
  }

  @Delete(':id')
  remove(@Req() req: UserRequest, @Param('id') id: string) {
    return this.habitatService.remove(+id, req.user.userId);
  }
}
