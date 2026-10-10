import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CriteriaCategoryEntity } from './criteria-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class PerformanceCategoriesService {
  private readonly logger = new Logger(PerformanceCategoriesService.name);

  constructor(
    @InjectRepository(CriteriaCategoryEntity)
    private readonly categoriesRepository: Repository<CriteriaCategoryEntity>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CriteriaCategoryEntity> {
    await this.assertNameIsFree(dto.category_name);
    const category = this.categoriesRepository.create(dto);
    await this.categoriesRepository.save(category);
    this.logger.log(
      `Criteria category #${category.category_id} "${category.category_name}" created`,
    );
    return category;
  }

  async findAll(includeInactive = false): Promise<CriteriaCategoryEntity[]> {
    return this.categoriesRepository.find({
      where: includeInactive ? {} : { is_active: true },
      order: { category_name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CriteriaCategoryEntity> {
    const category = await this.categoriesRepository.findOne({
      where: { category_id: id },
    });
    if (!category) {
      throw new NotFoundException(`Criteria category #${id} not found`);
    }
    return category;
  }

  async update(
    id: number,
    dto: UpdateCategoryDto,
  ): Promise<CriteriaCategoryEntity> {
    const category = await this.findOne(id);

    
    if (dto.category_name && dto.category_name !== category.category_name) {
      await this.assertNameIsFree(dto.category_name);
    }

    Object.assign(category, dto);
    await this.categoriesRepository.save(category);
    this.logger.log(`Criteria category #${id} updated`);
    return category;
  }

  async deactivate(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id);
    if (!category.is_active) {
      throw new ConflictException(
        `Criteria category #${id} is already inactive`,
      );
    }
    category.is_active = false;
    await this.categoriesRepository.save(category);
    this.logger.log(`Criteria category #${id} deactivated`);
    return { message: `Criteria category #${id} has been deactivated` };
  }

  private async assertNameIsFree(name: string): Promise<void> {
    const existing = await this.categoriesRepository.findOne({
      where: { category_name: name },
    });
    if (existing) {
      throw new ConflictException(
        `A criteria category named "${name}" already exists`,
      );
    }
  }
}