import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const permissions = [
  'order.read', 'order.write', 'order.create',
  'catalogue.read', 'catalogue.write',
  'companies.read', 'companies.write',
  'kitchen.read', 'kitchen.work',
  'dispatch.read', 'dispatch.write', 'dispatch.update',
  'driver.read', 'driver.write', 'drivers.assign', 'driver.own_deliveries', 'driver.deliver',
  'settings.read', 'settings.edit', 'settings.write',
  'billing.read', 'billing.write',
];

const rolePermissions: Record<string, string[]> = {
  ADMIN: permissions,
  KITCHEN: ['kitchen.read', 'kitchen.work', 'catalogue.read', 'order.read'],
  DISPATCH: ['dispatch.read', 'dispatch.write', 'dispatch.update', 'order.read', 'driver.read', 'drivers.assign'],
  DRIVER: ['driver.read', 'driver.write', 'driver.own_deliveries', 'driver.deliver'],
};

const demoUsers = [
  { email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' },
  { email: 'kitchen@test.com', name: 'Kitchen Staff', role: 'KITCHEN' },
  { email: 'dispatch@test.com', name: 'Dispatch Manager', role: 'DISPATCH' },
  { email: 'driver@test.com', name: 'Driver One', role: 'DRIVER' },
  { email: 'driver2@test.com', name: 'Driver Two', role: 'DRIVER' },
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
  const createdUsers = [];
  for (const user of demoUsers) {
      const u = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password,
          roleId: roles.get(user.role)!,
        },
      });
      createdUsers.push(u);
  }
  
  const adminUser = createdUsers.find(u => u.email === 'admin@test.com')!;
  const driver1 = createdUsers.find(u => u.email === 'driver@test.com')!;
  const driver2 = createdUsers.find(u => u.email === 'driver2@test.com')!;

  // CREATE DUMMY DATA
  console.log('Generating dummy data...');

  const defaultTier = await prisma.priceTier.create({ data: { name: 'Default Catalogue', isDefault: true } });
  const enterpriseTier = await prisma.priceTier.create({ data: { name: 'Enterprise', isDefault: false, derivationType: 'MARKUP_PERCENT', derivationValue: 10 } });

  const grillStation = await prisma.kitchenStation.create({ data: { name: 'Grill' } });
  const saladStation = await prisma.kitchenStation.create({ data: { name: 'Salad' } });
  const dessertStation = await prisma.kitchenStation.create({ data: { name: 'Dessert' } });
  const wokStation = await prisma.kitchenStation.create({ data: { name: 'Wok' } });
  
  const mainsCat = await prisma.category.create({ data: { name: 'Mains' } });
  const sidesCat = await prisma.category.create({ data: { name: 'Sides' } });
  const dessertCat = await prisma.category.create({ data: { name: 'Desserts' } });

  const optChicken = await prisma.option.create({ data: { name: 'Add Chicken', costPrice: 200 } });
  const optTofu = await prisma.option.create({ data: { name: 'Add Tofu', costPrice: 150 } });
  const optBeef = await prisma.option.create({ data: { name: 'Add Beef', costPrice: 300 } });
  const optExtraSauce = await prisma.option.create({ data: { name: 'Extra Sauce', costPrice: 50 } });
  const optGlutenFree = await prisma.option.create({ data: { name: 'Gluten Free Base', costPrice: 100 } });

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

  const dish3 = await prisma.dish.create({
    data: {
      name: 'Beef Stir Fry',
      sku: 'DSH-BEEF',
      description: 'Wok tossed beef with veggies and noodles.',
      costPrice: 1400,
      imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80',
      dietaryType: 'NON_VEG',
      temperature: 'HOT',
      isActive: true,
      categoryId: mainsCat.id,
      kitchenStationId: wokStation.id,
    }
  });

  const dish4 = await prisma.dish.create({
    data: {
      name: 'Chocolate Lava Cake',
      sku: 'DSH-CHOC',
      description: 'Warm chocolate cake with a gooey center.',
      costPrice: 600,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c8e9e5cb?w=800&q=80',
      dietaryType: 'VEG',
      temperature: 'HOT',
      isActive: true,
      categoryId: dessertCat.id,
      kitchenStationId: dessertStation.id,
    }
  });

  const group1 = await prisma.optionGroup.create({
    data: { name: 'Protein Choice', isRequired: false, displayOrder: 1, dishId: dish2.id }
  });
  await prisma.optionGroupOption.createMany({
    data: [
      { optionGroupId: group1.id, optionId: optChicken.id, displayOrder: 1 },
      { optionGroupId: group1.id, optionId: optTofu.id, displayOrder: 2 },
    ]
  });

  const group2 = await prisma.optionGroup.create({
    data: { name: 'Extras', isRequired: false, displayOrder: 1, dishId: dish3.id }
  });
  await prisma.optionGroupOption.createMany({
    data: [
      { optionGroupId: group2.id, optionId: optExtraSauce.id, displayOrder: 1 },
      { optionGroupId: group2.id, optionId: optGlutenFree.id, displayOrder: 2 },
    ]
  });

  const acme = await prisma.company.create({
    data: { name: 'Acme Corp', billingEmail: 'billing@acme.com', priceTierId: defaultTier.id, defaultDeliveryTime: '12:00' }
  });
  const acmeAddr1 = await prisma.companyAddress.create({
    data: { companyId: acme.id, label: 'HQ', address: '123 Acme Way, Techville, CA 90210', isDefault: true }
  });
  const acmeAddr2 = await prisma.companyAddress.create({
    data: { companyId: acme.id, label: 'Warehouse', address: '999 Industrial Pkwy, Techville, CA 90212', isDefault: false }
  });
  const empAcme = await prisma.employee.create({
    data: { companyId: acme.id, name: 'John Doe', email: 'john@acme.com' }
  });

  const globex = await prisma.company.create({
    data: { name: 'Globex', billingEmail: 'finance@globex.com', priceTierId: enterpriseTier.id, defaultDeliveryTime: '12:30' }
  });
  const globexAddr = await prisma.companyAddress.create({
    data: { companyId: globex.id, label: 'Main Office', address: '1 Globex Way, Springfield', isDefault: true }
  });
  const empGlobex = await prisma.employee.create({
    data: { companyId: globex.id, name: 'Hank Scorpio', email: 'hank@globex.com' }
  });

  const wayne = await prisma.company.create({
    data: { name: 'Wayne Ent', billingEmail: 'billing@wayne.com', priceTierId: defaultTier.id, defaultDeliveryTime: '13:00' }
  });
  const wayneAddr = await prisma.companyAddress.create({
    data: { companyId: wayne.id, label: 'Wayne Tower', address: '1000 Wayne Blvd, Gotham', isDefault: true }
  });
  const empWayne = await prisma.employee.create({
    data: { companyId: wayne.id, name: 'Bruce Wayne', email: 'bruce@wayne.com' }
  });

  // Create Orders for Tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);

  const today = new Date();
  today.setHours(0,0,0,0);

  // Helper to create an order
  const createOrder = async (employeeId: number, date: Date, time: string, status: string, dishIds: number[], addressId: number) => {
    const o = await prisma.order.create({
      data: {
        employeeId,
        createdById: adminUser.id,
        deliveryDate: date,
        deliveryTime: time,
        status,
        totalAmount: dishIds.length * 1500, // mock price
      }
    });

    for (const dId of dishIds) {
      const d = [dish1, dish2, dish3, dish4].find(x => x.id === dId)!;
      const ol = await prisma.orderLine.create({
        data: {
          orderId: o.id,
          dishId: dId,
          quantity: 2,
          dishName: d.name,
          dishSku: d.sku,
          unitPrice: 1500,
          lineTotal: 3000
        }
      });
      await prisma.orderCombination.create({
        data: {
          orderLineId: ol.id,
          quantity: 2,
          unitPrice: 1500,
          totalPrice: 3000,
          kitchenStationId: d.kitchenStationId,
          kitchenStatus: status === 'CONFIRMED' ? 'NOT_STARTED' : 'DONE'
        }
      });
    }
    return o;
  };

  console.log('Generating dummy orders & drops...');

  // 1. Confirmed orders ready to be grouped (Acme Corp, HQ, 12:00)
  await createOrder(empAcme.id, tomorrow, '12:00', 'CONFIRMED', [dish1.id, dish2.id], acmeAddr1.id);
  await createOrder(empAcme.id, tomorrow, '12:00', 'CONFIRMED', [dish3.id], acmeAddr1.id);
  
  // 2. Confirmed order different time (Acme Corp, HQ, 13:00)
  await createOrder(empAcme.id, tomorrow, '13:00', 'CONFIRMED', [dish1.id], acmeAddr1.id);

  // 3. Already dropped orders (Globex, Main Office, 12:30) - WAITING_ON_KITCHEN
  const o4 = await createOrder(empGlobex.id, tomorrow, '12:30', 'CONFIRMED', [dish2.id, dish4.id], globexAddr.id);
  const drop1 = await prisma.drop.create({
    data: { companyId: globex.id, addressId: globexAddr.id, deliveryDate: tomorrow, deliveryTime: '12:30', status: 'WAITING_ON_KITCHEN' }
  });
  await prisma.order.update({ where: { id: o4.id }, data: { dropId: drop1.id } });

  // 4. Ready to leave drop (Wayne Ent, Wayne Tower, 13:00)
  const o5 = await createOrder(empWayne.id, tomorrow, '13:00', 'CONFIRMED', [dish1.id, dish3.id], wayneAddr.id);
  // Mark kitchen done
  await prisma.orderCombination.updateMany({ where: { orderLine: { orderId: o5.id } }, data: { kitchenStatus: 'DONE' }});
  const drop2 = await prisma.drop.create({
    data: { companyId: wayne.id, addressId: wayneAddr.id, deliveryDate: tomorrow, deliveryTime: '13:00', status: 'READY_TO_LEAVE' }
  });
  await prisma.order.update({ where: { id: o5.id }, data: { dropId: drop2.id } });

  // 5. Out for delivery (Today)
  const o6 = await createOrder(empAcme.id, today, '12:00', 'OUT_FOR_DELIVERY', [dish2.id], acmeAddr2.id);
  const drop3 = await prisma.drop.create({
    data: { companyId: acme.id, addressId: acmeAddr2.id, deliveryDate: today, deliveryTime: '12:00', status: 'OUT_FOR_DELIVERY', driverId: driver1.id }
  });
  await prisma.order.update({ where: { id: o6.id }, data: { dropId: drop3.id } });

  // 6. Delivered (Today)
  const o7 = await createOrder(empWayne.id, today, '11:00', 'DELIVERED', [dish4.id], wayneAddr.id);
  const drop4 = await prisma.drop.create({
    data: { companyId: wayne.id, addressId: wayneAddr.id, deliveryDate: today, deliveryTime: '11:00', status: 'DELIVERED', driverId: driver2.id, deliveredAt: new Date(), onTime: true }
  });
  await prisma.order.update({ where: { id: o7.id }, data: { dropId: drop4.id } });

  console.log('Database successfully seeded with expanded dummy data!');
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
