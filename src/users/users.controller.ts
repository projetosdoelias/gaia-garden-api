import { Body, Controller, Post, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.usersService.create(createUserDto);
      return {
        id: user.id,
        username: user.username,
        confirmed: user.confirmed,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
