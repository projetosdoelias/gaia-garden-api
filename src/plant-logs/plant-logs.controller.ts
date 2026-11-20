import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreatePlantLogDto } from './dto/create-plant-log.dto';
import { PlantLogQueryDto } from './dto/plant-log-query.dto';
import {
  PlantLogDeletedResponseDto,
  PlantLogResponseDto,
} from './dto/plant-log-response.dto';
import { UpdatePlantLogDto } from './dto/update-plant-log.dto';
import { PlantLogsService } from './plant-logs.service';

interface UserRequest extends Request {
  user: {
    userId: number;
    username: string;
  };
}

@ApiTags('plant-logs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiNotFoundResponse({
  description:
    'Habitat not found or not owned by the user, plant not found in the habitat, or log not found',
})
@Controller('habitat/:habitatId/plants/:plantId/logs')
@UseGuards(JwtGuard)
export class PlantLogsController {
  constructor(private readonly plantLogsService: PlantLogsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a plant log entry',
    description:
      'Adds a dated diary entry to a plant. Only OBSERVATION is accepted for now. Requires notes and/or healthScore.',
  })
  @ApiCreatedResponse({ type: PlantLogResponseDto })
  @ApiBadRequestResponse({
    description:
      'Unsupported type, healthScore outside 1-5, missing notes and healthScore, details sent for OBSERVATION, or occurredAt in the future',
  })
  create(
    @Req() req: UserRequest,
    @Param('habitatId', ParseIntPipe) habitatId: number,
    @Param('plantId', ParseIntPipe) plantId: number,
    @Body() dto: CreatePlantLogDto,
  ) {
    return this.plantLogsService.create(
      habitatId,
      plantId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List plant log entries',
    description:
      'Ordered by occurredAt desc (id desc as tie-breaker). Optional filters: from (inclusive), to (exclusive), type.',
  })
  @ApiOkResponse({ type: [PlantLogResponseDto] })
  @ApiBadRequestResponse({ description: 'Invalid from, to or type' })
  findAll(
    @Req() req: UserRequest,
    @Param('habitatId', ParseIntPipe) habitatId: number,
    @Param('plantId', ParseIntPipe) plantId: number,
    @Query() query: PlantLogQueryDto,
  ) {
    return this.plantLogsService.findAll(
      habitatId,
      plantId,
      req.user.userId,
      query,
    );
  }

  @Get(':logId')
  @ApiOperation({ summary: 'Get a plant log entry' })
  @ApiBadRequestResponse({ description: 'Non-numeric id' })
  @ApiOkResponse({ type: PlantLogResponseDto })
  findOne(
    @Req() req: UserRequest,
    @Param('habitatId', ParseIntPipe) habitatId: number,
    @Param('plantId', ParseIntPipe) plantId: number,
    @Param('logId', ParseIntPipe) logId: number,
  ) {
    return this.plantLogsService.findOne(
      habitatId,
      plantId,
      req.user.userId,
      logId,
    );
  }

  @Patch(':logId')
  @ApiOperation({
    summary: 'Update a plant log entry',
    description:
      'Updates notes, healthScore and/or occurredAt. type and details are not updatable and are ignored if sent. Fields cannot be cleared with null.',
  })
  @ApiOkResponse({ type: PlantLogResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid field value' })
  update(
    @Req() req: UserRequest,
    @Param('habitatId', ParseIntPipe) habitatId: number,
    @Param('plantId', ParseIntPipe) plantId: number,
    @Param('logId', ParseIntPipe) logId: number,
    @Body() dto: UpdatePlantLogDto,
  ) {
    return this.plantLogsService.update(
      habitatId,
      plantId,
      req.user.userId,
      logId,
      dto,
    );
  }

  @Delete(':logId')
  @ApiOperation({ summary: 'Delete a plant log entry (soft delete)' })
  @ApiBadRequestResponse({ description: 'Non-numeric id' })
  @ApiOkResponse({ type: PlantLogDeletedResponseDto })
  remove(
    @Req() req: UserRequest,
    @Param('habitatId', ParseIntPipe) habitatId: number,
    @Param('plantId', ParseIntPipe) plantId: number,
    @Param('logId', ParseIntPipe) logId: number,
  ) {
    return this.plantLogsService.remove(
      habitatId,
      plantId,
      req.user.userId,
      logId,
    );
  }
}
