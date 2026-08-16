import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { TelemetryAuthGuard } from '../auth/guards/telemetry-auth.guard';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

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
  @UseGuards(ApiKeyGuard)
  findAll() {
    return this.telemetryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.telemetryService.findOne(+id);
  }
}
