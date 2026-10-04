import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  async findAllDrops(dateStr?: string) {
    let whereClause = {};
    if (dateStr) {
      whereClause = { deliveryDate: new Date(dateStr) };
    }
    
    // We should return board view model instead of raw drops
    const drops = await this.prisma.drop.findMany({
      where: whereClause,
      include: {
        driver: true,
        orders: {
          include: {
            employee: { include: { company: true } },
            lines: {
              include: {
                combinations: true
              }
            }
          }
        }
      },
      orderBy: [
        { deliveryDate: 'asc' },
        { deliveryTime: 'asc' }
      ]
    });

    // Compute derived properties
    return drops.map(drop => {
      let totalMeals = 0;
      let totalCombinations = 0;
      let completedCombinations = 0;
      let isReady = false;

      for (const o of drop.orders) {
        for (const line of o.lines) {
          totalMeals += line.quantity;
          for (const combo of line.combinations) {
            totalCombinations++;
            if (combo.kitchenStatus === 'DONE') {
              completedCombinations++;
            }
          }
        }
      }

      isReady = totalCombinations > 0 && totalCombinations === completedCombinations;

      return {
        ...drop,
        orderCount: drop.orders.length,
        totalMeals,
        totalCombinations,
        completedCombinations,
        isReady,
        companyName: drop.orders[0]?.employee?.company?.name || 'Unknown',
        address: 'Unknown' // ideally fetch address label
      };
    });
  }

  async generateDrops(dateStr: string) {
    const targetDate = new Date(dateStr);
    
    // Find all confirmed orders for this date that are not yet assigned to a drop
    const confirmedOrders = await this.prisma.order.findMany({
      where: {
        deliveryDate: targetDate,
        status: 'CONFIRMED',
        dropId: null
      },
      include: {
        employee: {
          include: {
            company: {
              include: { addresses: true, employees: { include: { company: true } } }
            }
          }
        }
      }
    });

    if (confirmedOrders.length === 0) {
      return { success: true, message: 'No pending confirmed orders found for this date to dispatch.', dropsCreated: 0 };
    }

    const groups = new Map<string, any[]>();
    
    for (const order of confirmedOrders) {
      const companyId = order.employee.companyId;
      const defaultAddress = order.employee.company.addresses.find(a => a.isDefault) || order.employee.company.addresses[0];
      const addressId = defaultAddress?.id || -1; 
      
      if (addressId === -1) {
        continue;
      }

      const key = `${companyId}-${addressId}-${order.deliveryTime}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(order);
    }

    let dropsCreated = 0;

    for (const [key, orders] of groups.entries()) {
      const [companyIdStr, addressIdStr, timeStr] = key.split('-');
      
      const drop = await this.prisma.drop.create({
        data: {
          companyId: Number(companyIdStr),
          addressId: Number(addressIdStr),
          deliveryDate: targetDate,
          deliveryTime: timeStr,
          status: 'WAITING_ON_KITCHEN'
        }
      });
      
      // Assign orders to drop. Leave their status as CONFIRMED.
      await this.prisma.order.updateMany({
        where: { id: { in: orders.map(o => o.id) } },
        data: { 
          dropId: drop.id
        }
      });
      
      dropsCreated++;
    }

    return { success: true, dropsCreated };
  }

  async assignDriver(dropId: number, driverId: number) {
    const drop = await this.prisma.drop.findUnique({ where: { id: dropId } });
    if (!drop) throw new NotFoundException('Drop not found');
    
    if (drop.status === 'DELIVERED') {
      throw new BadRequestException('Cannot reassign driver for a delivered drop');
    }

    const user = await this.prisma.user.findUnique({ where: { id: driverId }, include: { role: true } });
    if (!user || user.role.name !== 'DRIVER') {
      throw new BadRequestException('User is not a driver');
    }

    return this.prisma.drop.update({
      where: { id: dropId },
      data: { driverId }
    });
  }

  async updateDropStatus(dropId: number, status: string) {
    const drop = await this.prisma.drop.findUnique({
      where: { id: dropId },
      include: {
        orders: {
          include: { lines: { include: { combinations: true } } }
        }
      }
    });

    if (!drop) throw new NotFoundException('Drop not found');

    if (status === 'READY_TO_LEAVE') {
      let ready = true;
      let totalCombos = 0;
      for (const o of drop.orders) {
        for (const l of o.lines) {
          for (const c of l.combinations) {
            totalCombos++;
            if (c.kitchenStatus !== 'DONE') ready = false;
          }
        }
      }
      if (totalCombos === 0 || !ready) {
        throw new BadRequestException('Not all combinations are prepared by kitchen');
      }
    }

    if (status === 'OUT_FOR_DELIVERY') {
      if (drop.status !== 'READY_TO_LEAVE') throw new BadRequestException('Drop must be packed first');
      if (!drop.driverId) throw new BadRequestException('Must assign driver before delivery');
    }

    if (status === 'DELIVERED') {
      if (drop.status !== 'OUT_FOR_DELIVERY') throw new BadRequestException('Drop must be out for delivery first');
    }

    await this.prisma.drop.update({
      where: { id: dropId },
      data: { status }
    });
    
    if (status === 'DELIVERED') {
       await this.prisma.order.updateMany({
         where: { dropId },
         data: { status: 'DELIVERED' }
       });
    } else if (status === 'OUT_FOR_DELIVERY') {
       await this.prisma.order.updateMany({
         where: { dropId },
         data: { status: 'OUT_FOR_DELIVERY' }
       });
    }

    return { success: true };
  }

  async completeDelivery(dropId: number, driverId: number, note?: string, photoUrl?: string) {
    const drop = await this.prisma.drop.findUnique({ where: { id: dropId } });
    if (!drop) throw new NotFoundException('Drop not found');
    if (drop.driverId !== driverId) throw new BadRequestException('Unauthorized');
    if (drop.status !== 'OUT_FOR_DELIVERY') throw new BadRequestException('Invalid state');

    const now = new Date();
    let onTime = true;
    if (drop.deliveryTime) {
      const [h, m] = drop.deliveryTime.split(':').map(Number);
      const limit = new Date(drop.deliveryDate);
      limit.setHours(h, m, 0, 0);
      onTime = now <= limit;
    }

    await this.prisma.drop.update({
      where: { id: dropId },
      data: {
        status: 'DELIVERED',
        deliveredAt: now,
        deliveryNote: note,
        deliveryPhotoUrl: photoUrl,
        onTime
      }
    });

    await this.prisma.order.updateMany({
      where: { dropId },
      data: { status: 'DELIVERED' }
    });

    return { success: true };
  }
}
