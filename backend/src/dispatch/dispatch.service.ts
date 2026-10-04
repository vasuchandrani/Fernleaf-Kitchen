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
    
    return this.prisma.drop.findMany({
      where: whereClause,
      include: {
        driver: true,
        orders: {
          include: {
            employee: { include: { company: true } },
          }
        }
      },
      orderBy: [
        { deliveryDate: 'asc' },
        { deliveryTime: 'asc' }
      ]
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
              include: { addresses: true }
            }
          }
        }
      }
    });

    if (confirmedOrders.length === 0) {
      return { success: true, message: 'No pending confirmed orders found for this date to dispatch.', dropsCreated: 0 };
    }

    // Group by companyId + addressId + deliveryTime
    // Wait, the order doesn't explicitly store addressId directly in the schema, 
    // but CompanyAddress handles addresses. Let's group by Company + DeliveryTime. 
    // And assume the default address for the company is used.
    
    const groups = new Map<string, any[]>();
    
    for (const order of confirmedOrders) {
      const companyId = order.employee.companyId;
      const defaultAddress = order.employee.company.addresses.find(a => a.isDefault) || order.employee.company.addresses[0];
      const addressId = defaultAddress?.id || -1; // Fallback if no address
      const key = `${companyId}-${addressId}-${order.deliveryTime}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(order);
    }

    let dropsCreated = 0;

    // Create a Drop for each group and assign orders to it
    for (const [key, orders] of groups.entries()) {
      const [companyIdStr, addressIdStr, timeStr] = key.split('-');
      
      if (Number(addressIdStr) === -1) {
        continue; // Skip companies without an address
      }
      
      const drop = await this.prisma.drop.create({
        data: {
          companyId: Number(companyIdStr),
          addressId: Number(addressIdStr),
          deliveryDate: targetDate,
          deliveryTime: timeStr,
          status: 'PENDING'
        }
      });
      
      // Assign orders to drop and update their status to DISPATCH
      await this.prisma.order.updateMany({
        where: { id: { in: orders.map(o => o.id) } },
        data: { 
          dropId: drop.id,
          status: 'DISPATCH'
        }
      });
      
      dropsCreated++;
    }

    return { success: true, dropsCreated };
  }

  async assignDriver(dropId: number, driverId: number) {
    const drop = await this.prisma.drop.findUnique({ where: { id: dropId } });
    if (!drop) throw new NotFoundException('Drop not found');
    
    return this.prisma.drop.update({
      where: { id: dropId },
      data: { driverId }
    });
  }

  async updateDropStatus(dropId: number, status: string) {
    const drop = await this.prisma.drop.update({
      where: { id: dropId },
      data: { status }
    });
    
    // If drop is OUT_FOR_DELIVERY or DELIVERED, update orders too
    if (status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') {
       let orderStatus = status === 'DISPATCHED' ? 'OUT_FOR_DELIVERY' : status; 
       await this.prisma.order.updateMany({
         where: { dropId },
         data: { status: orderStatus }
       });
    }
    
    return drop;
  }
}
