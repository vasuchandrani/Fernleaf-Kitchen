import { Controller, Get, Post, Body, Patch, Delete, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CatalogueService, CreateOptionDto, CreateStationDto, CreateOptionGroupDto, AddOptionToGroupDto } from './catalogue.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { RequirePermissions } from '../auth/require-permissions.decorator';

@Controller('catalogue/dishes')
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Post()
  @RequirePermissions('catalogue.write')
  create(@Body() createDishDto: CreateDishDto) {
    return this.catalogueService.createDish(createDishDto);
  }

  @Get()
  @RequirePermissions('catalogue.read')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.catalogueService.findAllDishes(includeInactive === 'true');
  }

  @Get(':id')
  @RequirePermissions('catalogue.read')
  findOne(@Param('id', ParseIntPipe) id: number, @Query('tierId') tierId?: string) {
    return this.catalogueService.findOneDish(id, tierId ? Number(tierId) : undefined);
  }

  @Patch(':id')
  @RequirePermissions('catalogue.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDishDto: UpdateDishDto) {
    return this.catalogueService.updateDish(id, updateDishDto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('catalogue.write')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.deactivateDish(id);
  }

  @Post(':id/option-groups')
  @RequirePermissions('catalogue.write')
  createOptionGroup(
    @Param('id', ParseIntPipe) dishId: number,
    @Body() dto: CreateOptionGroupDto
  ) {
    return this.catalogueService.createOptionGroup(dishId, dto);
  }

  @Delete(':id/option-groups/:groupId')
  @RequirePermissions('catalogue.write')
  deleteOptionGroup(
    @Param('id', ParseIntPipe) dishId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.catalogueService.deleteOptionGroup(dishId, groupId);
  }

  @Post(':id/option-groups/:groupId/options')
  @RequirePermissions('catalogue.write')
  addOptionToGroup(
    @Param('id', ParseIntPipe) dishId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: AddOptionToGroupDto
  ) {
    return this.catalogueService.addOptionToGroup(dishId, groupId, dto);
  }
}

@Controller('catalogue/options')
export class OptionsController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Post()
  @RequirePermissions('catalogue.write')
  create(@Body() dto: CreateOptionDto) {
    return this.catalogueService.createOption(dto);
  }

  @Get()
  @RequirePermissions('catalogue.read')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.catalogueService.findAllOptions(includeInactive === 'true');
  }

  @Patch(':id')
  @RequirePermissions('catalogue.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateOptionDto>) {
    return this.catalogueService.updateOption(id, dto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('catalogue.write')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.catalogueService.deactivateOption(id);
  }
}

@Controller('catalogue/stations')
export class StationsController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Post()
  @RequirePermissions('catalogue.write')
  create(@Body() dto: CreateStationDto) {
    return this.catalogueService.createStation(dto);
  }

  @Get()
  @RequirePermissions('catalogue.read')
  findAll() {
    return this.catalogueService.findAllStations();
  }
}

export class CreateCategoryDto {
  name: string;
}

@Controller('catalogue/categories')
export class CategoriesController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get()
  @RequirePermissions('catalogue.read')
  findAll() {
    return this.catalogueService.findAllCategories();
  }

  @Post()
  @RequirePermissions('catalogue.write')
  create(@Body() dto: CreateCategoryDto) {
    return this.catalogueService.createCategory(dto);
  }
}
