import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  private async buildOrderLines(
    lines: CreateOrderDto['lines'],
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    let orderTotal = 0;
    const dishIds = [...new Set(lines.map(line => line.dishId))];
    const dishes = await client.dish.findMany({
      where: { id: { in: dishIds } },
      select: { id: true, kitchenStationId: true },
    });
    const stationByDish = new Map(dishes.map(dish => [dish.id, dish.kitchenStationId]));
    const mappedLines = lines.map(line => {
      let lineTotal = 0;
      const mappedCombinations = line.combinations.map(combo => {
        const comboUnitPrice = line.unitPrice + combo.options.reduce((sum, option) => sum + option.optionPrice, 0);
        const comboTotalPrice = comboUnitPrice * combo.quantity;
        lineTotal += comboTotalPrice;
        return {
          quantity: combo.quantity,
          unitPrice: comboUnitPrice,
          totalPrice: comboTotalPrice,
          kitchenStationId: stationByDish.get(line.dishId) ?? null,
          options: { create: combo.options },
        };
      });
      orderTotal += lineTotal;
      return {
        dishId: line.dishId,
        dishName: line.dishName,
        dishSku: line.dishSku,
        unitPrice: line.unitPrice,
        quantity: line.combinations.reduce((sum, combination) => sum + combination.quantity, 0),
        lineTotal,
        combinations: { create: mappedCombinations },
      };
    });
    return { mappedLines, orderTotal };
  }

  async createOrder(adminId: number, dto: CreateOrderDto) {
    if (!['DRAFT', 'PLACED'].includes(dto.status)) {
      throw new BadRequestException('New orders must be DRAFT or PLACED');
    }

    const { mappedLines, orderTotal } = await this.buildOrderLines(dto.lines);

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
    data: { deliveryTime?: string; deliveryDate?: string; status?: string; lines?: CreateOrderDto['lines'] },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (data.lines && !['DRAFT', 'PLACED'].includes(order.status)) {
      throw new BadRequestException('Only draft or placed orders can have their dishes edited');
    }
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

    if (!data.lines) {
      return this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: { employee: { include: { company: true } }, lines: { include: { combinations: { include: { options: true } } } } },
      });
    }
    return this.prisma.$transaction(async tx => {
      const oldLines = await tx.orderLine.findMany({ where: { orderId }, select: { id: true } });
      const oldCombinations = await tx.orderCombination.findMany({ where: { orderLineId: { in: oldLines.map(line => line.id) } }, select: { id: true } });
      await tx.combinationOption.deleteMany({ where: { combinationId: { in: oldCombinations.map(combo => combo.id) } } });
      await tx.orderCombination.deleteMany({ where: { orderLineId: { in: oldLines.map(line => line.id) } } });
      await tx.orderLine.deleteMany({ where: { orderId } });
      const { mappedLines, orderTotal } = await this.buildOrderLines(data.lines!, tx);
      return tx.order.update({
        where: { id: orderId },
        data: { ...updateData, totalAmount: orderTotal, lines: { create: mappedLines } },
        include: { employee: { include: { company: true } }, lines: { include: { combinations: { include: { options: true } } } } },
      });
    });
  }

  async findAllOrders(status?: string, deliveryDate?: string) {
    const whereClause: { status?: string; deliveryDate?: { gte: Date; lt: Date } } = {};
    if (status) whereClause.status = status;
    if (deliveryDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
        throw new BadRequestException('deliveryDate must be YYYY-MM-DD');
      }
      const start = new Date(`${deliveryDate}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) throw new BadRequestException('deliveryDate must be YYYY-MM-DD');
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      whereClause.deliveryDate = { gte: start, lt: end };
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

  async updateKitchenStatus(orderId: number, comboId: number, statusStr: string) {
    const allowedStatuses = ['NOT_STARTED', 'STARTED', 'DONE'];
    if (!allowedStatuses.includes(statusStr)) {
      throw new BadRequestException('Invalid kitchen status');
    }
    const combination = await this.prisma.orderCombination.findUnique({
      where: { id: comboId },
      include: { orderLine: { include: { order: true } } },
    });
    if (!combination || combination.orderLine.order.id !== orderId) {
      throw new NotFoundException(`Kitchen combination ${comboId} was not found for order ${orderId}`);
    }
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
