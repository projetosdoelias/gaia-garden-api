import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockDate = new Date('2026-01-01T00:00:00.000Z');

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: '$2b$10$hashedpassword',
    confirmed: true,
    createdAt: mockDate,
    updatedAt: mockDate,
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user when found by username', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findOne('testuser');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findUserConfirmed', () => {
    it('should return a user when found and confirmed', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.findUserConfirmed('testuser');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser', confirmed: true },
      });
    });

    it('should return null when user exists but is not confirmed', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findUserConfirmed('unconfirmed_user');

      expect(result).toBeNull();
    });

    it('should return null when user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.findUserConfirmed('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto = { username: 'newuser', password: 'plainpassword' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const hashedPassword = '$2b$10$mockedhash';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const createdUser = {
        id: 3,
        username: 'newuser',
        password: hashedPassword,
        confirmed: false,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      };
      jest.spyOn(prisma.user, 'create').mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          password: hashedPassword,
          confirmed: false,
        },
      });
    });

    it('should throw ConflictException when username already exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const createUserDto = { username: 'testuser', password: 'plainpassword' };

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('testuser', 'correctpassword');

      expect(result).toEqual(mockUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctpassword',
        mockUser.password,
      );
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when user is not confirmed', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUser('unconfirmed_user', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        mockUser.password,
      );
    });
  });
});
