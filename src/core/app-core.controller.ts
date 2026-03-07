import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserGuard } from '../auth/user.guard';
import { AppCoreService } from './app-core.service';
import { Public } from '../auth/public.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

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
  // @UseInterceptors(
  //   FileFieldsInterceptor([{ name: 'gallery', maxCount: 100 }], multerUploadOptions),
  // )
  async addBusiness(@Body() body: Record<string, string>, @Req() req: Request) {
    const email = (req as any).user!.email;
    // const reqFiles = (req as any).files as { gallery?: Express.Multer.File[] } | undefined;
    // const files = Array.isArray(reqFiles?.gallery) ? reqFiles.gallery : [];
    const dto: any = body;
    // const baseUrl = `${req.protocol}://${req.get('host') ?? ''}`;
    // dto.gallery = this.appCoreService.getUploadedImageUrls(files, baseUrl);
    return this.appCoreService.addBusiness(dto, email);
  }

  @Post('update-business/:businessId')
  @UseGuards(UserGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async updateBusiness(
    @Param('businessId') businessId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    console.log("businessId", businessId);
    const email = (req as any).user!.email;
    console.log("body", req.body);
    const dto: Record<string, unknown> = { ...body };
    console.log("dto", dto)
    if (body.gallery !== undefined) {
      let gallery = body.gallery;
      if (typeof gallery === 'string') {
        try {
          gallery = JSON.parse(gallery);
        } catch {
          gallery = [];
        }
      }
      dto.gallery = Array.isArray(gallery) ? gallery : [];
    }
    if (typeof dto.categoryId === 'string') dto.categoryId = parseInt(dto.categoryId as string, 10);
    if (typeof dto.subcategoryId === 'string') dto.subcategoryId = parseInt(dto.subcategoryId as string, 10);
    if (typeof dto.services_offered === 'string') {
      try {
        dto.services_offered = JSON.parse(dto.services_offered as string);
      } catch {
        dto.services_offered = [];
      }
    }
    console.log("dto final", dto)
    return this.appCoreService.updateBusiness(Number(businessId), dto, email);
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
  @HttpCode(HttpStatus.OK)
  @Public()
  // @Header('Cache-Control', 'no-store')
  async getCategories() {
    return this.appCoreService.getCategoriesWithSubcategories();
  }

  @Get('get-all-business')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getAllBusiness(@Req() req: Request) {
    console.log("query", req.query);
    const subcatId = req.query.subCatId != null ? Number(req.query.subCatId) : undefined;
    const is_popular = req.query.is_popular != null ? Number(req.query.is_popular) : undefined;
    const is_recent = req.query.is_recent != null ? Number(req.query.is_recent) : undefined;
    const filters =
      subcatId != null || is_popular != null || is_recent != null
        ? { subcatId, is_popular, is_recent }
        : undefined;
    return this.appCoreService.getAllBusinesses(filters);
  }

  @Get('get-user-businesses')
  @UseGuards(UserGuard)
  @HttpCode(HttpStatus.OK)
  async getUserBusinesses(@Req() req: Request) {
    const user = (req as any).user as { userId?: number; email: string };
    const userId = user.userId as number;
    if (!userId) {
      throw new BadRequestException('UserId cannot be null');
    }
    return this.appCoreService.getBusinessesByUserId(userId);
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

  @Get('home-feed')  
  async getAllSubcat(){
    return this.appCoreService.getAllSubcategories();
  }

  @Get('get-business-by-id')
  @HttpCode(HttpStatus.OK)
  async getBusinessById(@Req() req: Request){
    const { businessId }= req.query;
    if(!businessId){
      throw new BadRequestException('BusinessId is Required')
    }
    return this.appCoreService.getBusinessById(Number(businessId));
  }

  @Post('delete-profile')
  @UseGuards(UserGuard)
  @HttpCode(HttpStatus.OK)
  async deleteProfile(@Req() req: Request) {
    const user = (req as any).user as { userId?: number };
    const userId = user?.userId;
    if (userId == null || userId === undefined) {
      throw new BadRequestException('User not found');
    }
    return this.appCoreService.deleteProfile(userId);
  }

  @Post('update-user-info')
  @UseGuards(UserGuard)
  @HttpCode(HttpStatus.OK)
  async updateUserInfo(@Body() payload: { name?: string; email?: string; phone_no?: string }, @Req() req: Request) {
    const user = (req as any).user as { userId?: number };
    const userId = user?.userId;
    if (userId == null || userId === undefined) {
      throw new BadRequestException('User not found');
    }
    const body: { name?: string; email?: string; phone_no?: string } = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.phone_no !== undefined) body.phone_no = payload.phone_no;
    return this.appCoreService.updateUserInfo(userId, body);
  }
}


