import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyService } from '../../api-key/api-key.service';
import { JwtGuard } from './jwt.guard';

@Injectable()
export class TelemetryAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly jwtGuard: JwtGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Try API Key authentication first
    const apiKey = request.header('x-api-key');
    if (apiKey) {
      const validationResult = await this.apiKeyService.validateApiKey(apiKey);
      if (!validationResult) {
        throw new UnauthorizedException('Invalid API key');
      }
      request['apiKeyId'] = validationResult.habitatId;
      return true;
    }

    // Fall back to JWT authentication
    return this.jwtGuard.canActivate(context);
  }
}
