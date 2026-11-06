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
import { PlantsService } from './plants.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Request } from 'express';

interface UserRequest extends Request {
  user: {
    userId: number;
    username: string;
  };
}

@ApiTags('plants')
@Controller('habitat/:habitatId/plants')
@UseGuards(JwtGuard)
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Post()
  create(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Body() createPlantDto: CreatePlantDto,
  ) {
    return this.plantsService.create(
      +habitatId,
      req.user.userId,
      createPlantDto,
    );
  }

  @Get()
  findAll(@Req() req: UserRequest, @Param('habitatId') habitatId: string) {
    return this.plantsService.findAll(+habitatId, req.user.userId);
  }

  @Get(':id')
  findOne(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Param('id') id: string,
  ) {
    return this.plantsService.findOne(+habitatId, req.user.userId, +id);
  }

  @Patch(':id')
  update(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Param('id') id: string,
    @Body() updatePlantDto: UpdatePlantDto,
  ) {
    return this.plantsService.update(
      +habitatId,
      req.user.userId,
      +id,
      updatePlantDto,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: UserRequest,
    @Param('habitatId') habitatId: string,
    @Param('id') id: string,
  ) {
    return this.plantsService.remove(+habitatId, req.user.userId, +id);
  }
}