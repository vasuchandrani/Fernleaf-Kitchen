import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAllInvoices() {
    return this.prisma.invoice.findMany({
      include: {
        company: true,
        _count: { select: { orders: true } }
      },
      orderBy: { id: 'desc' }
    });
  }

  async generateInvoices() {
    // Find all DELIVERED orders that are not yet invoiced
    const unbilledOrders = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        invoiceId: null
      },
      include: {
        employee: true
      }
    });

    if (unbilledOrders.length === 0) {
      return { success: true, message: 'No unbilled delivered orders found.', invoicesCreated: 0 };
    }

    // Group by company
    const groups = new Map<number, any[]>();
    for (const order of unbilledOrders) {
      const companyId = order.employee.companyId;
      if (!groups.has(companyId)) {
        groups.set(companyId, []);
      }
      groups.get(companyId)!.push(order);
    }

    let invoicesCreated = 0;

    for (const [companyId, orders] of groups.entries()) {
      const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const invoiceNumber = `INV-${Date.now()}-${companyId}`;

      const invoice = await this.prisma.invoice.create({
        data: {
          companyId,
          invoiceNumber,
          totalAmount,
          isPaid: false
        }
      });

      await this.prisma.order.updateMany({
        where: { id: { in: orders.map(o => o.id) } },
        data: { invoiceId: invoice.id }
      });

      invoicesCreated++;
    }

    return { success: true, invoicesCreated };
  }

  async markAsPaid(invoiceId: number) {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { isPaid: true }
    });
  }
}
