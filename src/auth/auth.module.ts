import { Module } from '@nestjs/common';
import { ApiKeyModule } from '../api-key/api-key.module';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [ApiKeyModule],
  providers: [],
  exports: [ApiKeyModule],
})
export class AuthModule {}
