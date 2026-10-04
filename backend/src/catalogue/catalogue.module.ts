import { Module } from '@nestjs/common';
import { CatalogueController, OptionsController, StationsController, CategoriesController } from './catalogue.controller';
import { CatalogueService } from './catalogue.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogueController, OptionsController, StationsController, CategoriesController],
  providers: [CatalogueService]
})
export class CatalogueModule {}
