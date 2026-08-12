import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  create(@Body() createTelemetryDto: CreateTelemetryDto) {
    return this.telemetryService.create(createTelemetryDto);
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
