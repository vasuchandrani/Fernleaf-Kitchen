import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const permissions = [
  'order.read', 'order.write', 'order.create',
  'catalogue.read', 'catalogue.write',
  'companies.read', 'companies.write',
  'kitchen.read', 'kitchen.work',
  'dispatch.read', 'dispatch.write',
  'driver.read', 'driver.write',
  'settings.read', 'settings.write',
  'billing.read', 'billing.write',
];

const rolePermissions: Record<string, string[]> = {
  ADMIN: permissions,
  KITCHEN: ['kitchen.read', 'kitchen.work', 'catalogue.read', 'order.read'],
  DISPATCH: ['dispatch.read', 'dispatch.write', 'order.read', 'driver.read'],
  DRIVER: ['driver.read', 'driver.write'],
};

const demoUsers = [
  { email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' },
  { email: 'kitchen@test.com', name: 'Kitchen Staff', role: 'KITCHEN' },
  { email: 'dispatch@test.com', name: 'Dispatch Manager', role: 'DISPATCH' },
  { email: 'driver@test.com', name: 'Driver One', role: 'DRIVER' },
];

async function main() {
  console.log('Resetting business data and restoring demo access data...');

  await prisma.combinationOption.deleteMany();
  await prisma.orderCombination.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.drop.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.companyAddress.deleteMany();
  await prisma.companyHiddenDish.deleteMany();
  await prisma.company.deleteMany();
  await prisma.dishPrice.deleteMany();
  await prisma.optionPrice.deleteMany();
  await prisma.optionGroupOption.deleteMany();
  await prisma.optionGroup.deleteMany();
  await prisma.option.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.kitchenStation.deleteMany();
  await prisma.priceTier.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.kitchenHoliday.deleteMany();

  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  const permissionIds = new Map<string, number>();
  for (const action of permissions) {
    const permission = await prisma.permission.create({ data: { action } });
    permissionIds.set(permission.action, permission.id);
  }

  const roles = new Map<string, number>();
  for (const [name, actions] of Object.entries(rolePermissions)) {
      const role = await prisma.role.create({
        data: {
          name,
          description: `${name[0]}${name.slice(1).toLowerCase()} role`,
          permissions: {
            create: actions.map(action => ({
              permissionId: permissionIds.get(action)!,
            })),
          },
        },
      });
      roles.set(name, role.id);
  }

  await prisma.priceTier.create({
    data: { name: 'Default Catalogue', isDefault: true },
  });

  const password = await bcrypt.hash('Test@1234', 10);
  for (const user of demoUsers) {
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password,
          roleId: roles.get(user.role)!,
        },
      });
  }

  console.log('Database now contains only permissions, roles, and demo users.');
  console.log('Demo password: Test@1234');
}

main()
  .catch((error) => {
    console.error('Database reset failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
