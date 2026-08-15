import { Module } from '@nestjs/common';
import { ApiKeyModule } from '../api-key/api-key.module';
import { ApiKeyGuard } from './guards/api-key.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    ApiKeyModule,
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1800s' },
    }),
  ],
  providers: [AuthService],
  exports: [ApiKeyModule, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
