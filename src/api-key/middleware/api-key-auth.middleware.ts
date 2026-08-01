import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiKeyAuthMiddleware implements NestMiddleware {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ message: 'API key is required' });
    }

    const validationResult = await this.apiKeyService.validateApiKey(apiKey);

    if (!validationResult) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    req['habitat'] = { id: validationResult.habitatId };
    next();
  }
}
