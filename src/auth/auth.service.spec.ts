import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: '$2b$10$hashedpassword',
    confirmed: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return an access_token when credentials are valid', async () => {
      jest
        .spyOn(usersService, 'validateUser')
        .mockResolvedValue(mockUser);

      const expectedToken = 'jwt.access.token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(expectedToken);

      const result = await service.signIn('testuser', 'correctpassword');

      expect(result).toEqual({ access_token: expectedToken });
      expect(usersService.validateUser).toHaveBeenCalledWith(
        'testuser',
        'correctpassword',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        userId: 1,
        username: 'testuser',
      });
    });

    it('should throw UnauthorizedException when user validation fails', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      await expect(
        service.signIn('testuser', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not confirmed', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      await expect(
        service.signIn('unconfirmed_user', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      await expect(
        service.signIn('nonexistent', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
