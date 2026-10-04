import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { PrismaService } from '../prisma/prisma.service';

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
  @RequirePermissions('dispatch.update')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string
  ) {
    return this.dispatchService.updateDropStatus(id, status);
  }

  @Get('drivers')
  @RequirePermissions('drivers.assign')
  getDrivers(@Req() req: any) {
    // Need PrismaService here, or call a method in DispatchService. Let's just use Prisma directly.
    return this.dispatchService['prisma'].user.findMany({
      where: { role: { name: 'DRIVER' }, isActive: true },
      select: { id: true, name: true, email: true }
    });
  }

  @Get('driver/drops')
  @RequirePermissions('driver.own_deliveries')
  getDriverDrops(@Req() req: any, @Query('date') date?: string) {
    const driverId = req.user.userId;
    let whereClause: any = { driverId };
    if (date) {
      whereClause.deliveryDate = new Date(date);
    }
    
    return this.dispatchService['prisma'].drop.findMany({
      where: whereClause,
      include: {
        orders: {
          include: {
            employee: { include: { company: { include: { addresses: true } } } },
            lines: { include: { combinations: true } }
          }
        }
      },
      orderBy: [
        { deliveryDate: 'asc' },
        { deliveryTime: 'asc' }
      ]
    });
  }

  @Post('driver/drops/:id/complete')
  @RequirePermissions('driver.deliver')
  completeDelivery(
    @Req() req: any,
    @Param('id', ParseIntPipe) dropId: number,
    @Body('note') note?: string,
    @Body('photoUrl') photoUrl?: string
  ) {
    const driverId = req.user.userId;
    return this.dispatchService.completeDelivery(dropId, driverId, note, photoUrl);
  }
}
