import { Module } from '@nestjs/common';
import { CatalogueController, OptionsController, StationsController } from './catalogue.controller';
import { CatalogueService } from './catalogue.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogueController, OptionsController, StationsController],
  providers: [CatalogueService]
})
export class CatalogueModule {}
