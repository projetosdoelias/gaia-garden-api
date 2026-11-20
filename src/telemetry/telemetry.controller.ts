import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TelemetryAuthGuard } from '../auth/guards/telemetry-auth.guard';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { TelemetryLastResponseDto } from './dto/telemetry-last-response.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Request } from 'express';

interface TelemetryRequest extends Request {
  apiKeyId?: number;
  user?: { userId: number; username: string };
}

@ApiTags('telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @UseGuards(TelemetryAuthGuard)
  @ApiOperation({
    summary: 'Record a telemetry reading',
    description:
      'With an API key, habitatId comes from the key. With a JWT, habitatId is required in the body and the habitat must belong to the user (404 otherwise).',
  })
  @ApiNotFoundResponse({
    description: 'Habitat not found or not owned by the user (JWT only)',
  })
  create(
    @Body() createTelemetryDto: CreateTelemetryDto,
    @Req() request: TelemetryRequest,
  ) {
    return this.telemetryService.createAuthorized(createTelemetryDto, {
      apiKeyHabitatId: request.apiKeyId,
      userId: request.user?.userId,
    });
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.telemetryService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.telemetryService.findOne(+id);
  }

  @Get(':id/last')
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Get the latest telemetry record from a habitat',
    description:
      'Returns the most recent telemetry entry for the given habitat ID, ordered by createdAt descending.',
  })
  @ApiOkResponse({
    type: TelemetryLastResponseDto,
    description: 'The latest telemetry record found',
  })
  @ApiNotFoundResponse({
    description: 'No telemetry records found for the given habitat ID',
  })
  async findLast(@Param('id') id: string) {
    const habitatId = +id;

    if (isNaN(habitatId)) {
      throw new BadRequestException('habitatId must be a valid number');
    }

    const telemetry =
      await this.telemetryService.findLastByHabitatId(habitatId);

    if (!telemetry) {
      throw new NotFoundException(
        `No telemetry found for habitat ${habitatId}`,
      );
    }

    return telemetry;
  }
}
