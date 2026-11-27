import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { HabitatTelemetryService } from './habitat-telemetry.service';
import { TelemetryListQueryDto } from './dto/telemetry-list-query.dto';
import { TelemetryPageResponseDto } from './dto/telemetry-page-response.dto';
import { TelemetrySeriesQueryDto } from './dto/telemetry-series-query.dto';
import { TelemetrySeriesResponseDto } from './dto/telemetry-series-response.dto';

interface UserRequest extends Request {
  user: {
    userId: number;
    username: string;
  };
}

@ApiTags('telemetry')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiNotFoundResponse({
  description: 'Habitat not found or not owned by the user',
})
@Controller('habitat/:habitatId/telemetry')
@UseGuards(JwtGuard)
export class HabitatTelemetryController {
  constructor(private readonly service: HabitatTelemetryService) {}

  @Get()
  @ApiOperation({
    summary: 'List telemetry readings of a habitat (cursor pagination)',
    description:
      'Readings ordered by recordedAt desc (id desc as tie-breaker). Pass `nextCursor` as `cursor` to get the next page.',
  })
  @ApiOkResponse({ type: TelemetryPageResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid limit, cursor or range' })
  list(
    @Req() req: UserRequest,
    @Param('habitatId', ParseIntPipe) habitatId: number,
    @Query() query: TelemetryListQueryDto,
  ) {
    return this.service.list(habitatId, req.user.userId, query);
  }

  @Get('series')
  @ApiOperation({
    summary: 'Aggregated telemetry time series of a habitat',
    description:
      'Returns avg/min/max/count per hour or day bucket, computed in the given time zone. Empty buckets are omitted.',
  })
  @ApiOkResponse({ type: TelemetrySeriesResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid range, bucket, metric or tz',
  })
  series(
    @Req() req: UserRequest,
    @Param('habitatId', ParseIntPipe) habitatId: number,
    @Query() query: TelemetrySeriesQueryDto,
  ) {
    return this.service.series(habitatId, req.user.userId, query);
  }
}
