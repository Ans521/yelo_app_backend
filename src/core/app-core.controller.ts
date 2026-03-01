import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserGuard } from '../auth/user.guard';
import { AppCoreService } from './app-core.service';
import { Public } from '../auth/public.decorator';

@Controller('api')
export class AppCoreController {
  constructor(private readonly appCoreService: AppCoreService) {}

  @Post('upload-image')
  @Public()
  uploadImage(@Req() req: Request) {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const baseUrl = `${req.protocol}://${req.get('host') ?? ''}`;
    const imageUrl = `${baseUrl.replace(/\/$/, '')}/upload/${file.filename}`;
    return { imageUrl };
  }

  @Post('add-business')
  @UseGuards(UserGuard)
  async addBusiness(@Body() body: Record<string, string>, @Req() req: Request) {
    const email = (req as any).user!.email;
    const rawFiles = (req as any).files ?? {};
    const files = [
      ...(Array.isArray(rawFiles.gallery) ? rawFiles.gallery : []),
    ];
    const dto: any = body;
    const baseUrl = `${req.protocol}://${req.get('host') ?? ''}`;
    dto.gallery = this.appCoreService.getUploadedImageUrls(files, baseUrl);
    return this.appCoreService.addBusiness(dto, email);
  }

  @Post('add-banner')
  @Public()
  async addBanner(@Body() body: Record<string, string>) {
    console.log("body: ", body);
    const { tittle, message, imageUrl } : any = body.data;
    if (!tittle || !message || !imageUrl) {
      throw new BadRequestException('Missing required fields: tittle, message, imageUrl');
    }
    return this.appCoreService.addBanner(tittle, message, imageUrl);
  }

  @Get('get-all-banner')
  @Public()
  async getAllBanner() {
    return await this.appCoreService.getAllBanners();
  }

  @Post('mark-banner')
  @Public()
  async markBanner(@Body() body: { bannerId?: number; isMain?: boolean }) {
    const { bannerId, isMain } = body;
    if (!bannerId || isMain === undefined || isMain === null) {
      throw new BadRequestException('bannerId and isMain (boolean) are required');
    }
    return this.appCoreService.markBanner(bannerId, isMain);
  }

  @Post('add-categories')
  @Public()
  async addCategories(@Body() body: { category?: string; subcategories?: Array<{ name: string; image: string }> }) {
    const { category, subcategories } = body;
    if (!category || !category.trim()) {
      throw new BadRequestException('category is required');
    }
    if (!Array.isArray(subcategories)) {
      throw new BadRequestException('subcategories must be an array');
    }
    return this.appCoreService.addCategories(category.trim(), subcategories);
  }

  @Get('get-all-category')
  @Public()
  @HttpCode(HttpStatus.OK)
  // @Header('Cache-Control', 'no-store')
  async getCategories() {
    return this.appCoreService.getCategoriesWithSubcategories();
  }

  @Get('get-all-business')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getAllBusiness() {
    return this.appCoreService.getAllBusinesses();
  }

  @Get('get-counts')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getCounts() {
    return this.appCoreService.getCounts();
  }

  @Post('update-business-flags')
  @Public()
  async updateBusinessFlags(
    @Body() body: { business_id: number; is_popular?: number; is_recent?: number; is_verified?: number },
  ) {
    const { business_id, is_popular, is_recent, is_verified } = body;
    if (business_id == null || business_id === undefined) {
      throw new BadRequestException('business_id is required');
    }
    return this.appCoreService.updateBusinessFlags(Number(business_id), {
      is_popular,
      is_recent,
      is_verified,
    });
  }

  @Post('delete-business')
  @Public()
  async deleteBusiness(@Body() body: { business_id?: number }) {
    const { business_id } = body;
    if (business_id == null || business_id === undefined) {
      throw new BadRequestException('business_id is required');
    }
    return this.appCoreService.deleteBusiness(Number(business_id));
  }

  @Post('update-category')
  @Public()
  async updateCategory(
    @Body()
    body: {
      category?: string;
      categoryId?: number | string;
      subcategories?: Array<{ subcategoryId?: number; name: string; image?: string }>;
    },
  ) {
    const { category, categoryId, subcategories } = body;
    if (categoryId == null || categoryId === undefined) {
      throw new BadRequestException('valid categoryId is required');
    }
    if (!category || !String(category).trim()) {
      throw new BadRequestException('category is required');
    }
    if (!Array.isArray(subcategories)) {
      throw new BadRequestException('subcategories must be an array');
    }
    return this.appCoreService.updateCategory(
      String(category).trim(),
      Number(categoryId),
      subcategories
    );
  }

  @Post('delete-category')
  @Public()
  async deleteCategory(@Body() body: { categoryId?: number, subcategoryId?: number, isCategory: boolean }) {
    const { categoryId, subcategoryId, isCategory } = body;
    if ((categoryId == null || categoryId === undefined) && (subcategoryId == null || subcategoryId === undefined)) {
      throw new BadRequestException('categoryId or subcategoryId is required');
    }
    return this.appCoreService.deleteCategory(Number(categoryId), Number(subcategoryId), isCategory);
  }
}


