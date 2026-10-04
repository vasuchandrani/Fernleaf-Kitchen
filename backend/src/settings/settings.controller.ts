import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
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
}
