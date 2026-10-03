import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLES = ['ADMIN', 'KITCHEN', 'DISPATCH', 'DRIVER'];

const USERS = [
  { email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' },
  { email: 'kitchen@test.com', name: 'Kitchen User', role: 'KITCHEN' },
  { email: 'dispatch@test.com', name: 'Dispatch User', role: 'DISPATCH' },
  { email: 'driver@test.com', name: 'Driver User', role: 'DRIVER' },
];

async function main() {
  console.log('Starting seeding on Neon DB...');

  // 1. Seed Roles only (no permissions for now as features are pending)
  for (const roleName of ROLES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log('Roles seeded.');

  // 2. Seed Users
  const hashedPassword = await bcrypt.hash('Test@1234', 10);
  for (const userData of USERS) {
    const role = await prisma.role.findUnique({ where: { name: userData.role } });
    if (!role) throw new Error(`Role ${userData.role} not found`);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: hashedPassword,
        roleId: role.id,
      },
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        roleId: role.id,
      },
    });
  }
  console.log('Users seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
