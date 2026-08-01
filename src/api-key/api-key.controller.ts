import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { ApiKeyListDto } from './dto/api-key-list.dto';

@ApiTags('api-keys')
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @ApiOkResponse({
    type: [ApiKeyListDto],
    description: 'List all API keys (without sensitive keyHash)',
    examples: {
      'Example Response': {
        summary: 'Sample API key list',
        value: [
          {
            id: 1,
            name: 'ESP32 Device',
            isActive: true,
            lastUsedAt: '2026-07-29T21:45:00.000Z',
            expiresAt: null,
            createdAt: '2026-07-29T21:30:00.000Z',
            updatedAt: '2026-07-29T21:45:00.000Z',
            habitatId: 1,
          },
        ],
      },
    },
  })
  async findAll(): Promise<ApiKeyListDto[]> {
    return this.apiKeyService.findAll();
  }

  @Post()
  @ApiCreatedResponse({
    type: ApiKeyResponseDto,
    description: 'Create a new API key (key is only shown once)',
    schema: {
      $ref: '#/components/schemas/CreateApiKeyDto',
    },
    examples: {
      'Example Request': {
        summary: 'Sample create request',
        value: {
          name: 'ESP32 Device',
          habitatId: 1,
        },
      },
      'Example Response': {
        summary: 'Sample create response',
        value: {
          id: 1,
          name: 'ESP32 Device',
          apiKey: 'gg_live_1234567890abcdef1234567890abcdef',
        },
      },
    },
  })
  async createApiKey(
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.createApiKey(createApiKeyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'API key successfully deactivated',
  })
  async deactivateApiKey(@Param('id') id: string): Promise<void> {
    await this.apiKeyService.deactivateApiKey(parseInt(id, 10));
  }
}
