import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetCategoriesDto } from './dto/get-category.dto';

@Controller('talent_categories')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);

  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getCategories(@Query() query: GetCategoriesDto) {
    try {
      const { type, status, parentId, search } = query;
      return await this.categoryService.findAll({
        type,
        search,
        parentId,
        status,
      });
    } catch (error) {
      this.logger.error(
        `Error fetching categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  @UseGuards(JwtGuard)
  @Post()
  async createCategory(@Body() dto: CreateCategoryDto) {
    try {
      return await this.categoryService.create(dto);
    } catch (error) {
      this.logger.error(
        `Error creating category: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':id/approve')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryStatusDto,
  ) {
    try {
      return await this.categoryService.updateStatus(
        id,
        dto.status,
        dto.name,
        dto.parentId,
      );
    } catch (error) {
      this.logger.error(
        `Error updating category status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    try {
      await this.categoryService.deleteCategory(id);
      return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting category: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
