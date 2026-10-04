import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { CatalogueModule } from './catalogue/catalogue.module';
import { PricingModule } from './pricing/pricing.module';
import { CompaniesModule } from './companies/companies.module';
import { OrdersModule } from './orders/orders.module';
import { SettingsModule } from './settings/settings.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, UsersModule, AuthModule, CatalogueModule, PricingModule, CompaniesModule, OrdersModule, SettingsModule, DispatchModule, InvoicesModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    }
  ],
})
export class AppModule {}
