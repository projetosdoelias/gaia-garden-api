import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should return an access_token when login is successful', async () => {
      const signInDto = { username: 'testuser', password: 'correctpassword' };
      const expectedResponse = { access_token: 'jwt.token.here' };

      jest.spyOn(authService, 'signIn').mockResolvedValue(expectedResponse);

      const result = await controller.signIn(signInDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.signIn).toHaveBeenCalledWith(
        signInDto.username,
        signInDto.password,
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const signInDto = { username: 'testuser', password: 'wrongpassword' };

      jest
        .spyOn(authService, 'signIn')
        .mockRejectedValue(new UnauthorizedException());

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
