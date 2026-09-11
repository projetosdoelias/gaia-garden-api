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
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtGuard } from '../auth/guards/jwt.guard';

@ApiTags('telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @UseGuards(TelemetryAuthGuard)
  create(
    @Body() createTelemetryDto: CreateTelemetryDto,
    @Req() request: Request,
  ) {
    const habitatId = request['apiKeyId'] ?? createTelemetryDto.habitatId;
    if (!habitatId) {
      throw new BadRequestException('habitatId is required');
    }
    return this.telemetryService.create({
      ...createTelemetryDto,
      habitatId,
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
