import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  
  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { user_id: id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

    async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);

    Object.assign(user, dto);
    const saved = await this.usersRepository.save(user);

    this.logger.log(`User #${userId} updated their own profile`);

    return saved;
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.user_id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    const matches = await bcrypt.compare(dto.current_password, user.password);
    if (!matches) {
      this.logger.warn(
        `Password change rejected for user #${userId}: wrong current password`,
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.new_password, 10);
    await this.usersRepository.update(userId, { password: hashed });

    this.logger.log(`User #${userId} changed their password`);

    return { message: 'Password changed successfully' };
  }
}