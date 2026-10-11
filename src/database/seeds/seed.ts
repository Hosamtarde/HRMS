import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../modules/users/user.entity';
import { CriteriaCategoryEntity } from '../../modules/performance/categories/criteria-category.entity';
import { Role } from '../../common/enums/enums';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const logger = new Logger('Seed');

const CRITERIA_CATEGORIES = [
  { category_name: 'جودة العمل', description: 'دقة واكتمال ما يُسلَّم' },
  { category_name: 'الالتزام بالمواعيد', description: 'التسليم في التواريخ المتفق عليها' },
  { category_name: 'التعاون', description: 'العمل مع باقي أعضاء القسم' },
  { category_name: 'المبادرة', description: 'اقتراح التحسينات ومعالجة المشكلات دون انتظار' },
  { category_name: 'الانضباط', description: 'الحضور والالتزام بسياسات العمل' },
];

async function seedUser(
  repo: Repository<UserEntity>,
  email: string,
  password: string,
  role: Role,
  firstName: string,
) {
  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    logger.warn(`${role} already exists: ${email}`);
    return;
  }

  const user = repo.create({
    first_name: firstName,
    last_name: role,
    email,
    password: await bcrypt.hash(password, 10),
    role,
    status: true,
  });
  await repo.save(user);
  logger.log(`Created ${role} => email: ${email} | password: ${password}`);
}

async function seedCriteriaCategories(
  repo: Repository<CriteriaCategoryEntity>,
) {
  for (const category of CRITERIA_CATEGORIES) {
    const existing = await repo.findOne({
      where: { category_name: category.category_name },
    });
    if (existing) {
      logger.warn(`Criteria category already exists: ${category.category_name}`);
      continue;
    }
    await repo.save(repo.create(category));
    logger.log(`Created criteria category: ${category.category_name}`);
  }
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const users = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  const categories = app.get<Repository<CriteriaCategoryEntity>>(
    getRepositoryToken(CriteriaCategoryEntity),
  );

  await seedUser(users, 'admin@hrms.com', 'admin123', Role.HR_ADMIN, 'HR');
  await seedUser(users, 'employee@hrms.com', 'employee123', Role.EMPLOYEE, 'Test');
  await seedCriteriaCategories(categories);

  await app.close();
}

seed();