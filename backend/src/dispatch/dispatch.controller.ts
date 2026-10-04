import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Query } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('drops')
  @RequirePermissions('order.read')
  findAllDrops(@Query('date') date?: string) {
    return this.dispatchService.findAllDrops(date);
  }

  @Post('drops/generate')
  @RequirePermissions('order.write')
  generateDrops(@Body('date') date: string) {
    return this.dispatchService.generateDrops(date);
  }

  @Patch('drops/:id/driver')
  @RequirePermissions('order.write')
  assignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body('driverId', ParseIntPipe) driverId: number
  ) {
    return this.dispatchService.assignDriver(id, driverId);
  }

  @Patch('drops/:id/status')
  @RequirePermissions('order.write')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string
  ) {
    return this.dispatchService.updateDropStatus(id, status);
  }
}
