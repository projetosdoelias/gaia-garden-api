import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

interface User {
  id: number;
  username: string;
  password: string;
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  userId?: number; // For backward compatibility
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findUserConfirmed(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username, confirmed: true },
    });
  }

  async create(data: { username: string; password: string }): Promise<User> {
    const existingUser = await this.findOne(data.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        confirmed: false,
      },
    });
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findUserConfirmed(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
}
