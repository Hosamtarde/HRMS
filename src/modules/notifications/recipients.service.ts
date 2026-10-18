import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { Role } from '../../common/enums/enums';

@Injectable()
export class RecipientsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(EmployeeProfileEntity)
    private readonly profilesRepository: Repository<EmployeeProfileEntity>,
  ) {}

  async getName(userId: number): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: { user_id: userId },
      select: { first_name: true, last_name: true },
    });
    return user ? `${user.first_name} ${user.last_name}` : 'موظف';
  }

  async getApproverIds(employeeId: number): Promise<number[]> {
    const profile = await this.profilesRepository.findOne({
      where: { user_id: employeeId },
      relations: { department: true },
    });

    const managerId = profile?.department?.manager_id ?? null;

    if (managerId && managerId !== employeeId) {
      return [managerId];
    }

    return this.getHrAdminIds();
  }

  async getHrAdminIds(): Promise<number[]> {
    const admins = await this.usersRepository.find({
      where: { role: Role.HR_ADMIN, status: true },
      select: { user_id: true },
    });
    return admins.map((admin) => admin.user_id);
  }
}