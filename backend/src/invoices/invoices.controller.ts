import { Controller, Get, Post, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions('settings.read') // Using settings.read or order.read? Invoices are typically admin only. Let's use order.read for simplicity.
  findAll() {
    return this.invoicesService.findAllInvoices();
  }

  @Post('generate')
  @RequirePermissions('order.write') // Admin action
  generateInvoices() {
    return this.invoicesService.generateInvoices();
  }

  @Patch(':id/pay')
  @RequirePermissions('order.write')
  markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.markAsPaid(id);
  }
}
