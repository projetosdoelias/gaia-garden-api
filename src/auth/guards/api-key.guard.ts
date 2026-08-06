import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from '../../api-key/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const apiKey = request.header('x-api-key');

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validationResult = await this.apiKeyService.validateApiKey(apiKey);

    if (!validationResult) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Make the validated data available to controllers
    request['habitat'] = {
      id: validationResult.habitatId,
    };

    return true;
  }
}
