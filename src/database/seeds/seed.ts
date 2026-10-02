import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../modules/users/user.entity';
import { Role } from '../../common/enums/enums';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
const logger = new Logger('Seed');

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

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

  await seedUser(repo, 'admin@hrms.com', 'admin123', Role.HR_ADMIN, 'HR');
  await seedUser(repo, 'employee@hrms.com', 'employee123', Role.EMPLOYEE, 'Test');

  await app.close();
}
seed();
