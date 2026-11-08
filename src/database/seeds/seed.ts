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
  {
    category_name: 'ط¬ظˆط¯ط© ط§ظ„ط¹ظ…ظ„',
    description: 'ط¯ظ‚ط© ظˆط§ظƒطھظ…ط§ظ„ ظ…ط§ ظٹظڈط³ظ„ظژظ‘ظ…',
  },
  {
    category_name: 'ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط§ظ„ظ…ظˆط§ط¹ظٹط¯',
    description: 'ط§ظ„طھط³ظ„ظٹظ… ظپظٹ ط§ظ„طھظˆط§ط±ظٹط® ط§ظ„ظ…طھظپظ‚ ط¹ظ„ظٹظ‡ط§',
  },
  {
    category_name: 'ط§ظ„طھط¹ط§ظˆظ†',
    description: 'ط§ظ„ط¹ظ…ظ„ ظ…ط¹ ط¨ط§ظ‚ظٹ ط£ط¹ط¶ط§ط، ط§ظ„ظ‚ط³ظ…',
  },
  {
    category_name: 'ط§ظ„ظ…ط¨ط§ط¯ط±ط©',
    description:
      'ط§ظ‚طھط±ط§ط­ ط§ظ„طھط­ط³ظٹظ†ط§طھ ظˆظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ط´ظƒظ„ط§طھ ط¯ظˆظ† ط§ظ†طھط¸ط§ط±',
  },
  {
    category_name: 'ط§ظ„ط§ظ†ط¶ط¨ط§ط·',
    description: 'ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط³ظٹط§ط³ط§طھ ط§ظ„ط¹ظ…ظ„',
  },
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
      logger.warn(
        `Criteria category already exists: ${category.category_name}`,
      );
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
  await seedUser(
    users,
    'employee@hrms.com',
    'employee123',
    Role.EMPLOYEE,
    'Test',
  );
  await seedCriteriaCategories(categories);

  await app.close();
}

void seed();
