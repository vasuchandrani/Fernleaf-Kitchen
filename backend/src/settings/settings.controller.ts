import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../auth/public.decorator';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Public() // Allow everyone to read settings (especially frontend create order flow)
  getSettings() {
    return this.settingsService.getAll();
  }

  @Put()
  @RequirePermissions('settings.edit')
  updateSettings(@Body() data: any) {
    return this.settingsService.updateAll(data);
  }

  @Get('roles')
  @RequirePermissions('settings.edit')
  getRoles() {
    return this.settingsService.getRoles();
  }

  @Get('permissions')
  @RequirePermissions('settings.edit')
  getPermissions() {
    return this.settingsService.getPermissions();
  }

  @Post('roles')
  @RequirePermissions('settings.edit')
  createRole(@Body() data: { name: string; description: string; permissionIds: number[] }) {
    return this.settingsService.createRole(data.name, data.description, data.permissionIds || []);
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('settings.edit')
  updateRolePermissions(@Param('id') id: string, @Body() data: { permissionIds: number[] }) {
    return this.settingsService.updateRolePermissions(Number(id), data.permissionIds || []);
  }
}
