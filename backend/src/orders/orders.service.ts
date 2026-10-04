import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

/**
 * State Machine Pattern: Valid order status transitions.
 * Enforces business rules for order lifecycle.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PLACED', 'CANCELLED'],
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COOKING', 'DELIVERED', 'CANCELLED'],
  COOKING: ['DISPATCH', 'DELIVERED', 'CANCELLED'],
  DISPATCH: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(adminId: number, dto: CreateOrderDto) {
    if (!['DRAFT', 'PLACED'].includes(dto.status)) {
      throw new BadRequestException('New orders must be DRAFT or PLACED');
    }

    // Calculate totals automatically from snapshot data
    let orderTotal = 0;

    const mappedLines = dto.lines.map(line => {
      let lineTotal = 0;
      
      const mappedCombinations = line.combinations.map(combo => {
        let comboUnitPrice = line.unitPrice;
        combo.options.forEach(opt => comboUnitPrice += opt.optionPrice);
        
        const comboTotalPrice = comboUnitPrice * combo.quantity;
        lineTotal += comboTotalPrice;

        return {
          quantity: combo.quantity,
          unitPrice: comboUnitPrice,
          totalPrice: comboTotalPrice,
          options: {
            create: combo.options
          }
        };
      });

      // Sum quantities across all combinations for this line
      const lineQuantity = line.combinations.reduce((sum, c) => sum + c.quantity, 0);
      orderTotal += lineTotal;

      return {
        dishId: line.dishId,
        dishName: line.dishName,
        dishSku: line.dishSku,
        unitPrice: line.unitPrice,
        quantity: lineQuantity,
        lineTotal: lineTotal,
        combinations: {
          create: mappedCombinations
        }
      };
    });

    return this.prisma.order.create({
      data: {
        employeeId: dto.employeeId,
        createdById: adminId,
        deliveryDate: new Date(dto.deliveryDate),
        deliveryTime: dto.deliveryTime,
        status: dto.status,
        totalAmount: orderTotal,
        lines: {
          create: mappedLines
        }
      },
      include: {
        lines: {
          include: { combinations: { include: { options: true } } }
        }
      }
    });
  }

  /**
   * State Machine Pattern: enforce valid status transitions.
   */
  async updateStatus(orderId: number, status: string) {
    const validStatuses = Object.keys(VALID_TRANSITIONS);
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        employee: { include: { company: true } },
        lines: { include: { combinations: { include: { options: true } } } },
      },
    });
  }

  /**
   * Admin override: Update delivery details on an order after confirmation.
   * Follows Single Responsibility - only handles delivery-related fields.
   */
  async updateOrderDetails(
    orderId: number,
    data: { deliveryTime?: string; deliveryDate?: string; status?: string },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const updateData: any = {};
    if (data.deliveryTime) updateData.deliveryTime = data.deliveryTime;
    if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);
    if (data.status) {
      const allowed = VALID_TRANSITIONS[order.status] || [];
      if (!allowed.includes(data.status)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${data.status}`,
        );
      }
      updateData.status = data.status;
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        employee: { include: { company: true } },
        lines: { include: { combinations: { include: { options: true } } } },
      },
    });
  }

  async findAllOrders(status?: string) {
    let whereClause = {};
    if (status) {
      whereClause = { status };
    }
    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            company: true
          }
        },
        lines: {
          include: { combinations: { include: { options: true } } }
        }
      },
      orderBy: { id: 'desc' }
    });
    const dishIds = [...new Set(orders.flatMap(order => order.lines.map(line => line.dishId)))];
    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: dishIds } },
      select: { id: true, kitchenStation: { select: { id: true, name: true } } },
    });
    const stations = new Map(dishes.map(dish => [dish.id, dish.kitchenStation]));
    return orders.map(order => ({
      ...order,
      lines: order.lines.map(line => ({
        ...line,
        kitchenStation: stations.get(line.dishId) ?? null,
      })),
    }));
  }

  async findOneOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            company: true
          }
        },
        lines: {
          include: { combinations: { include: { options: true } } }
        }
      }
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async updateKitchenStatus(comboId: number, statusStr: string) {
    const allowedStatuses = ['NOT_STARTED', 'STARTED', 'DONE'];
    if (!allowedStatuses.includes(statusStr)) {
      throw new BadRequestException('Invalid kitchen status');
    }
    const combination = await this.prisma.orderCombination.findUnique({
      where: { id: comboId },
      include: { orderLine: { include: { order: true } } },
    });
    if (!combination) throw new NotFoundException(`Kitchen combination ${comboId} not found`);
    if (combination.orderLine.order.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed orders can be prepared');
    }
    const currentStatus = combination.kitchenStatus || 'NOT_STARTED';
    const transitions: Record<string, string[]> = {
      NOT_STARTED: ['STARTED'],
      STARTED: ['DONE'],
      DONE: [],
    };
    if (!transitions[currentStatus]?.includes(statusStr)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${statusStr}`);
    }
    return this.prisma.orderCombination.update({
      where: { id: comboId },
      data: { kitchenStatus: statusStr },
    });
  }

  async triggerCheckout(deliveryDateStr: string) {
    // Find all PLACED orders for this date and convert them to CONFIRMED
    const date = new Date(deliveryDateStr);
    
    const result = await this.prisma.order.updateMany({
      where: {
        deliveryDate: date,
        status: 'PLACED'
      },
      data: {
        status: 'CONFIRMED'
      }
    });

    return { success: true, confirmedCount: result.count };
  }
}
