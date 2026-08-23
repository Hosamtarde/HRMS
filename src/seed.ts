import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './modules/users/user.entity';
import { Role } from './common/enums/role.enum';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

  const email = 'admin@hrms.com';
  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log('HR Admin already exists:', email);
    await app.close();
    return;
  }

  const user = repo.create({
    first_name: 'HR',
    last_name: 'Admin',
    email,
    password: await bcrypt.hash('admin123', 10),
    role: Role.HR_ADMIN,
    status: true,
  });
  await repo.save(user);
  console.log('Created HR Admin => email: admin@hrms.com | password: admin123');
  await app.close();
}
seed();