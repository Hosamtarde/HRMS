import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveTypeEntity } from './leave-type.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypesService {
  private readonly logger = new Logger(LeaveTypesService.name);

  constructor(
    @InjectRepository(LeaveTypeEntity)
    private readonly leaveTypesRepository: Repository<LeaveTypeEntity>,
  ) {}

  async create(dto: CreateLeaveTypeDto): Promise<LeaveTypeEntity> {
    const existing = await this.leaveTypesRepository.findOne({
      where: { type_name: dto.type_name },
    });

    if (existing) {
      throw new ConflictException(`Leave type "${dto.type_name}" already exists`);
    }

    const leaveType = this.leaveTypesRepository.create(dto);
    const saved = await this.leaveTypesRepository.save(leaveType);

    this.logger.log(
      `Leave type created: "${saved.type_name}" (${saved.payment_type}, ${saved.default_days} days)`,
    );

    return saved;
  }

  async findAll(): Promise<LeaveTypeEntity[]> {
    return this.leaveTypesRepository.find({
      order: { leave_type_id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<LeaveTypeEntity> {
    const leaveType = await this.leaveTypesRepository.findOne({
      where: { leave_type_id: id },
    });

    if (!leaveType) {
      throw new NotFoundException(`Leave type #${id} not found`);
    }

    return leaveType;
  }

  async update(id: number, dto: UpdateLeaveTypeDto): Promise<LeaveTypeEntity> {
    const leaveType = await this.findOne(id);

    if (dto.type_name && dto.type_name !== leaveType.type_name) {
      const existing = await this.leaveTypesRepository.findOne({
        where: { type_name: dto.type_name },
      });
      if (existing) {
        throw new ConflictException(`Leave type "${dto.type_name}" already exists`);
      }
    }

    Object.assign(leaveType, dto);
    const saved = await this.leaveTypesRepository.save(leaveType);

    this.logger.log(`Leave type #${id} updated`);

    return saved;
  }

  async remove(id: number): Promise<{ message: string }> {
    const leaveType = await this.findOne(id);

    await this.leaveTypesRepository.remove(leaveType);

    this.logger.warn(`Leave type #${id} ("${leaveType.type_name}") deleted`);

    return { message: `Leave type #${id} deleted successfully` };
  }
}