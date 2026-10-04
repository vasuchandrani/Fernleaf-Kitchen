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
  await prisma.category.deleteMany();
  await prisma.kitchenStation.deleteMany();
  await prisma.priceTier.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.kitchenHoliday.deleteMany();

  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  // Create permissions & roles
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

  // Create users
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

  // CREATE DUMMY DATA
  console.log('Generating dummy data...');

  // 1. Tiers
  const defaultTier = await prisma.priceTier.create({ data: { name: 'Default Catalogue', isDefault: true } });
  const enterpriseTier = await prisma.priceTier.create({ data: { name: 'Enterprise', isDefault: false, derivationType: 'MARKUP_PERCENT', derivationValue: 10 } });

  // 2. Kitchen Stations & Categories
  const grillStation = await prisma.kitchenStation.create({ data: { name: 'Grill' } });
  const saladStation = await prisma.kitchenStation.create({ data: { name: 'Salad' } });
  
  const mainsCat = await prisma.category.create({ data: { name: 'Mains' } });
  const sidesCat = await prisma.category.create({ data: { name: 'Sides' } });

  // 3. Global Options
  const optChicken = await prisma.option.create({ data: { name: 'Add Chicken', costPrice: 200 } });
  const optTofu = await prisma.option.create({ data: { name: 'Add Tofu', costPrice: 150 } });

  // 4. Dishes
  const dish1 = await prisma.dish.create({
    data: {
      name: 'Grilled Salmon Bowl',
      sku: 'DSH-SLM',
      description: 'Fresh salmon with quinoa and greens.',
      costPrice: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
      dietaryType: 'NON_VEG',
      temperature: 'HOT',
      isActive: true,
      categoryId: mainsCat.id,
      kitchenStationId: grillStation.id,
    }
  });

  const dish2 = await prisma.dish.create({
    data: {
      name: 'Caesar Salad',
      sku: 'DSH-CSR',
      description: 'Classic caesar salad with croutons.',
      costPrice: 800,
      imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80',
      dietaryType: 'VEG',
      temperature: 'COLD',
      isActive: true,
      categoryId: sidesCat.id,
      kitchenStationId: saladStation.id,
    }
  });

  // 5. Option Groups for Dish 2
  const group1 = await prisma.optionGroup.create({
    data: {
      name: 'Protein Choice',
      isRequired: false,
      displayOrder: 1,
      dishId: dish2.id,
    }
  });

  await prisma.optionGroupOption.createMany({
    data: [
      { optionGroupId: group1.id, optionId: optChicken.id, displayOrder: 1 },
      { optionGroupId: group1.id, optionId: optTofu.id, displayOrder: 2 },
    ]
  });

  // 6. Companies & Employees
  const acme = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      billingEmail: 'billing@acme.com',
      priceTierId: defaultTier.id,
    }
  });
  
  await prisma.companyAddress.create({
    data: {
      companyId: acme.id,
      label: 'HQ',
      address: '123 Acme Way, Techville, CA 90210',
      isDefault: true,
    }
  });

  await prisma.employee.create({
    data: {
      companyId: acme.id,
      name: 'John Doe',
      email: 'john@acme.com',
    }
  });

  console.log('Database successfully seeded with demo data!');
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
