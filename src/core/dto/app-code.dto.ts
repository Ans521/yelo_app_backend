import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

/** DTO for adding a business. Id is optional (DB can auto-generate). */
export class AddBusinessDto { 
/** User who owns this business. */
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @MinLength(1)
  business_name: string;

  /** Reference to category (admin-added). */
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  /** Reference to subcategory (admin-added). */
  @IsInt()
  @IsNotEmpty()
  subcategoryId: number;

  @IsString()
  @IsNotEmpty()
  address: string;

  /** Long description / about us. */
  @IsString()
  aboutUs: string;

  /** List of services offered. */
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  services_offered: string[];

  /** Gallery: array of image/link URLs. */
  @IsArray()
  @IsNotEmpty()
  @IsUrl({}, { each: true })
  gallery: string[];

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @IsOptional()
  @IsBoolean()
  is_popular?: boolean;

  @IsOptional()
  @IsBoolean()
  is_recent?: boolean;
}
