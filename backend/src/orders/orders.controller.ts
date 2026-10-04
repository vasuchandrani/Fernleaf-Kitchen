import { Controller, Post, Body, Req, UseGuards, Patch, Param, ParseIntPipe, Get, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('order.create')
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get()
  @RequirePermissions('order.read')
  findAll(@Query('status') status?: string, @Query('deliveryDate') deliveryDate?: string) {
    return this.ordersService.findAllOrders(status, deliveryDate);
  }

  @Post('checkout')
  @RequirePermissions('order.write')
  triggerCheckout(@Body('deliveryDate') deliveryDate: string) {
    return this.ordersService.triggerCheckout(deliveryDate);
  }

  @Get(':id')
  @RequirePermissions('order.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOneOrder(id);
  }

  @Patch(':id/status')
  @RequirePermissions('order.write')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  /**
   * Admin override endpoint: update delivery time, date, or other details.
   */
  @Patch(':id')
  @RequirePermissions('order.write')
  updateOrderDetails(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { deliveryTime?: string; deliveryDate?: string; status?: string; lines?: CreateOrderDto['lines'] }
  ) {
    return this.ordersService.updateOrderDetails(id, data);
  }

  @Patch(':id/combinations/:comboId/kitchen-status')
  @RequirePermissions('kitchen.work')
  updateKitchenStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('comboId', ParseIntPipe) comboId: number,
    @Body('kitchenStatus') kitchenStatus: string
  ) {
    return this.ordersService.updateKitchenStatus(id, comboId, kitchenStatus);
  }
}
