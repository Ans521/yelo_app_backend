import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AddBusinessDto } from './dto/app-code.dto';
import { EventListenerTypes } from 'typeorm/metadata/types/EventListenerTypes.js';
import { filter } from 'rxjs';

// =============================================================================
// CONSTANTS – add your app-wide constants here
// =============================================================================

// =============================================================================
// TYPES / INTERFACES – add shared types and interfaces here
// =============================================================================

export interface UserRecord {
  id?: number;
  email?: string;
}

// =============================================================================
// HELPER FUNCTIONS – pure functions you use across the app (optional: move to a separate file later)
// =============================================================================

// =============================================================================
// APP CORE SERVICE – main place for your business logic
// Inject this service in controllers or other services when you need this logic.
// =============================================================================

@Injectable()
export class AppCoreService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * When a request comes with a token, pass the email (e.g. req.user.email).
   * Checks if the user exists in DB; returns the user or throws UnauthorizedException.
   */
  async authenticateUser(email: string): Promise<UserRecord> {
    const rows = await this.db.query<UserRecord[]>(
      'SELECT id, email FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    const user = rows?.[0];
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return user;
  }

  /**
   * Common function: take uploaded files (from Multer), return array of public URLs.
   * Call this after FilesInterceptor has saved files to the upload folder.
   * @param files from @UploadedFiles()
   * @param baseUrl e.g. http://localhost:3050 (from req.protocol + '://' + req.get('host'))
   */
  getUploadedImageUrls(files: Array<{ filename: string }> | undefined, baseUrl: string): string[] {
    if (!files?.length) return [];
    return files.map((f) => `${baseUrl.replace(/\/$/, '')}/upload/${f.filename}`);
  }

  async addBusiness(dto: any, email: string) : Promise<{message: string, id: any}> {
    try {
      console.log("dto", dto)
      const { id : userId } : UserRecord = await this.authenticateUser(email);
      const { business_name, categoryId, subcategoryId, address, aboutUs, services_offered, gallery , phone_no} = dto;
      console.log("gallery", gallery);
      const galleryJson = JSON.stringify(gallery ?? []);
      const query = `INSERT INTO businesses (user_id, business_name, category_id, subcategory_id, address, about_us, services_offered, gallery, phone_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const result = await this.db.query(query, [
        userId,
        business_name,
        categoryId,
        subcategoryId,
        address,
        aboutUs,
        JSON.stringify(services_offered),
        galleryJson,
        phone_no
      ]) as { insertId : number}; 
      return { message: 'Business added successfully', id: result?.insertId ?? 0 };
    } catch (error) {
      console.error('Error adding business:', error);
      throw new InternalServerErrorException('Failed to add business');
    }
  }

  /** Get businesses for a given user. Same shape as getAllBusinesses (gallery, services_offered as arrays). */
  async getBusinessesByUserId(userId: number): Promise<{ data: any[] }> {
    try {
      const rows = await this.db.query<any[]>(
        `SELECT
              b.id AS business_id,
              b.business_name AS business_name,
              b.address AS address,
              b.about_us AS about_us,
              b.services_offered AS services_offered,
              b.gallery AS gallery,
              b.is_verified AS is_verified,
              b.is_popular AS is_popular,
              b.is_recent AS is_recent,
              b.phone_no AS phone_no,
              u.email AS user_email,
              u.name AS user_name,
              c.name AS category_name,
              sc.name AS subcategory_name,
              sc.id AS subcategory_id,
              c.id AS category_id,
              sc.image_url AS subcategory_image_url
        FROM businesses b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ?
        ORDER BY b.id DESC`,
        [userId],
      );
      const list = Array.isArray(rows) ? rows : [];
      const data = list.map((row) => {
        let gallery = row?.gallery;
        if (typeof gallery === 'string') {
          try {
            gallery = JSON.parse(gallery);
          } catch {
            gallery = [];
          }
        }
        if (!Array.isArray(gallery)) gallery = [];
        let services_offered = row?.services_offered;
        if (typeof services_offered === 'string') {
          try {
            services_offered = JSON.parse(services_offered);
            console.log("services_offered fucking here", services_offered);
          } catch {
            services_offered = [];
          }
        }
        return { ...row, gallery, services_offered };
      });
      console.log("data fucking here", data);
      return { data };
    } catch (error) {
      console.error('Error fetching user businesses:', error);
      throw new InternalServerErrorException('Failed to fetch user businesses');
    }
  }

  /** Get all rows from businesses with user, category, subcategory. gallery and services_offered returned as arrays.
   * Optional filters: subcatId, is_popular, is_recent (only add WHERE when provided).
   */
  async getAllBusinesses(filters?: {
    subcatId?: number;
    is_popular?: number;
    is_recent?: number;
  }): Promise<{ data: any[] }> {
    try {
      console.log("filters", filters);
      const conditions: string[] = [];
      const params: unknown[] = [];
      if (filters?.subcatId && Number.isInteger(Number(filters.subcatId))) {
        conditions.push('b.subcategory_id = ?');
        params.push(Number(filters.subcatId));
      }
      if (filters?.is_popular) {
        conditions.push('b.is_popular = ?');
        params.push(Number(filters.is_popular));
      }
      if (filters?.is_recent) {
        conditions.push('b.is_recent = ?');
        params.push(Number(filters.is_recent));
      }
      const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

      const rows = await this.db.query<any[]>(
        `SELECT
              b.id AS business_id,
              b.business_name AS business_name,
              b.address AS address,
              b.about_us AS about_us,
              b.services_offered AS services_offered,
              b.gallery AS gallery,
              b.is_verified AS is_verified,
              b.is_popular AS is_popular,
              b.is_recent AS is_recent,
              u.email AS user_email,
              u.name AS user_name,
              c.name AS category_name,
              sc.name AS subcategory_name,
              sc.image_url AS subcategory_image_url
        FROM businesses b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE is_verified = 1
        ${whereClause}
        ORDER BY b.id DESC`,
        params,
      );
      const list = Array.isArray(rows) ? rows : [];
      const data = list.map((row) => {
        let gallery = row?.gallery;
        if (typeof gallery === 'string') {
          try {
            gallery = JSON.parse(gallery);
          } catch {
            gallery = [];
          }
        }
        if (!Array.isArray(gallery)) gallery = [];
        let services_offered = row?.services_offered;
        if (typeof services_offered === 'string') {
          try {
            services_offered = JSON.parse(services_offered);
          } catch {
            services_offered = [];
          }
        }
        if (!Array.isArray(services_offered)) services_offered = [];
        return { ...row, gallery, services_offered };
      });
      // console.log("data: ", data);
      return { data };
    } catch (error) {
      console.error('Error fetching businesses:', error);
      throw new InternalServerErrorException('Failed to fetch businesses');
    }
  }

  /** Update a business. Verifies the business belongs to the authenticated user. */
  async updateBusiness(
    businessId: number,
    dto: Partial<AddBusinessDto>,
    email: string,
  ): Promise<{ message: string }> {
    try {
      console.log("Yeah Hit Api")
      const id = Number(businessId);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Valid businessId is required');
      }
      // const { id: userId } = await this.authenticateUser(email);
      const { business_name, categoryId, subcategoryId, address, aboutUs, services_offered, gallery } = dto;
      const existing = await this.db.query<{ user_id: number }[]>(
        'SELECT user_id FROM businesses WHERE id = ? LIMIT 1',
        [id],
      );
      const row = existing?.[0];
      if (!row) {
        throw new BadRequestException('Business not found or access denied');
      }
      const updates: string[] = [];
      const params: unknown[] = [];
      if (business_name !== undefined) {
        updates.push('business_name = ?');
        params.push(business_name);
      }
      if (categoryId !== undefined) {
        updates.push('category_id = ?');
        params.push(categoryId);
      }
      if (subcategoryId !== undefined) {
        updates.push('subcategory_id = ?');
        params.push(subcategoryId);
      }
      if (address !== undefined) {
        updates.push('address = ?');
        params.push(address);
      }
      if (aboutUs !== undefined) {
        updates.push('about_us = ?');
        params.push(aboutUs);
      }
      if (services_offered !== undefined) {
        updates.push('services_offered = ?');
        params.push(JSON.stringify(services_offered));
      }
      if (gallery !== undefined) {
        updates.push('gallery = ?');
        params.push(JSON.stringify(gallery));
      }
      if (updates.length === 0) {
        throw new BadRequestException('At least one field to update is required');
      }
      params.push(id);
      await this.db.query(
        `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`,
        params,
      );
      return { message: 'Business updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error updating business:', error);
      throw new InternalServerErrorException('Failed to update business');
    }
  }

  /** Update business flags (is_popular, is_recent, is_verified) by business_id. */
  async updateBusinessFlags(
    businessId: number,
    payload: { is_popular?: number; is_recent?: number; is_verified?: number },
  ): Promise<{ message: string }> {
    try {
      const id = Number(businessId);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Valid business_id is required');
      }
      const updates: string[] = [];
      const params: unknown[] = [];
      if (payload.is_popular !== undefined) {
        updates.push('is_popular = ?');
        params.push(payload.is_popular);
      }
      if (payload.is_recent !== undefined) {
        updates.push('is_recent = ?');
        params.push(payload.is_recent);
      }
      if (payload.is_verified !== undefined) {
        updates.push('is_verified = ?');
        params.push(payload.is_verified);
      }
      if (updates.length === 0) {
        throw new BadRequestException('At least one of is_popular, is_recent, is_verified is required');
      }

      console.log("updates: ", updates)
      console.log("updates", updates.join(', '));

      params.push(id);
      await this.db.query(
        `UPDATE businesses SET ${updates.join(', ')} WHERE id = ?`,
        params,
      );
      return { message: 'Business updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error updating business flags:', error);
      throw new InternalServerErrorException('Failed to update business');
    }
  }

  /** Delete a business by business_id. */
  async deleteBusiness(businessId: number): Promise<{ message: string }> {
    try {
      const id = Number(businessId);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Valid business_id is required');
      }
      const result = await this.db.query('DELETE FROM businesses WHERE id = ?', [id]) as { affectedRows?: number };
      const affected = (result as any)?.affectedRows ?? 0;
      if (affected === 0) {
        throw new BadRequestException('Business not found');
      }
      return { message: 'Business deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error deleting business:', error);
      throw new InternalServerErrorException('Failed to delete business');
    }
  }

  /** Delete user profile and all their businesses. Call with userId from req.user. */
  async deleteProfile(userId: number): Promise<{ message: string }> {
    try {
      const id = Number(userId);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Valid user is required');
      }
      await this.db.query('DELETE FROM businesses WHERE user_id = ?', [id]);
      const result = await this.db.query('DELETE FROM users WHERE id = ?', [id]) as { affectedRows?: number };
      const affected = (result as any)?.affectedRows ?? 0;
      if (affected === 0) {
        throw new BadRequestException('User not found');
      }
      return { message: 'Profile deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error deleting profile:', error);
      throw new InternalServerErrorException('Failed to delete profile');
    }
  }

  /** Update user info (name, email, phone_no). Only provided fields are updated. */
  async updateUserInfo(
    userId: number,
    payload: { name?: string; email?: string; phone_no?: string },
  ): Promise<{ message: string }> {
    try {
      const id = Number(userId);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Valid user is required');
      }
      const updates: string[] = [];
      const params: unknown[] = [];
      if (payload.name !== undefined) {
        updates.push('name = ?');
        params.push(payload.name);
      }
      if (payload.email !== undefined) {
        updates.push('email = ?');
        params.push(payload.email);
      }
      if (payload.phone_no !== undefined) {
        updates.push('phoneno = ?');
        params.push(payload.phone_no);
      }
      if (updates.length === 0) {
        throw new BadRequestException('At least one of name, email, phone_no is required');
      }
      params.push(id);
      await this.db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params,
      );
      return { message: 'User info updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error updating user info:', error);
      throw new InternalServerErrorException('Failed to update user info');
    }
  }

  /** Get counts of businesses, users, and categories. */
  async getCounts(): Promise<{ businesses: number; users: number; categories: number }> {
    try {
      const rows = await this.db.query<any[]>(
        `SELECT
          (SELECT COUNT(*) FROM businesses) AS businesses,
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM categories) AS categories`,
      );
      const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
      return {
        businesses: Number(row?.businesses ?? 0),
        users: Number(row?.users ?? 0),
        categories: Number(row?.categories ?? 0),
      };
    } catch (error) {
      console.error('Error fetching counts:', error);
      throw new InternalServerErrorException('Failed to fetch counts');
    }
  }

  async addBanner(link: string, imageUrl: string): Promise<{ message: string; data: { link: string; imageUrl: string } }> {
    try {
      await this.db.query(
        'INSERT INTO banners (link, image_url) VALUES (?, ?)',
        [link, imageUrl],
      );
      return {
        message: 'Banner added successfully',
        data: { link, imageUrl },
      };
    } catch (error) {
      console.error('Error adding banner:', error);
      throw new InternalServerErrorException('Failed to add banner');
    }
  }

  async getAllBanners() {
    try {
      const banners = await this.db.query(
        `SELECT 
            id, 
            link, 
            image_url, 
            is_main 
        FROM banners 
        ORDER BY id DESC`,
      );
      return { data: Array.isArray(banners) ? banners : [] };
    } catch (error) {
      console.error('Error fetching banners:', error);
      throw new InternalServerErrorException('Failed to fetch banners');
    }
  }

  async markBanner(bannerId: number, isMain: boolean): Promise<{ message: string }> {
    try {
      console.log("isMain: ", isMain);
      console.log("bannerId: ", bannerId);
      if (isMain) {
        const existing = await this.db.query<Array<{ id: number }>>(
          'SELECT id FROM banners WHERE is_main = 1 LIMIT 1',
        );
        console.log("existing: ", existing);
        const hasMain = Array.isArray(existing) && existing.length > 0;
        if (hasMain && existing![0].id !== bannerId) {
          throw new BadRequestException(
            'A banner is already marked as main. Unmark it first.',
          );
        }
      }
      await this.db.query('UPDATE banners SET is_main = ? WHERE id = ?', [
        isMain,
        bannerId,
      ]);
      return { message: 'Banner updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error marking banner:', error);
      throw new InternalServerErrorException('Failed to update banner');
    }
  }

  async addCategories(category: string, subcategories: Array<{ name: string; image: string }>) {
    try {
      const insertResult = await this.db.query(
        'INSERT INTO categories (name, created_at) VALUES (?, NOW())',
        [category],
      ) as { insertId: number };
      const categoryId = insertResult.insertId;
      if (!categoryId) {
        throw new InternalServerErrorException('Failed to insert category');
      }

      const list = subcategories?.length ? subcategories.filter((sub) => sub.name && sub.image) : [];
      if (list.length > 0) {
        const placeholders = list.map(() => '(?, ?, ?, 0)').join(', ');
        const query = `INSERT INTO subcategories (name, category_id, image_url, is_main) VALUES ${placeholders}`;
        const params = list.flatMap((sub) => [sub.name, categoryId, sub.image ?? null]);
        await this.db.query(
          query,
          params
        );
      }
      return { message: 'Category and subcategories added successfully', categoryId };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) throw error;
      console.error('Error adding categories:', error);
      throw new InternalServerErrorException('Failed to add categories');
    }
  }

  async getCategoriesWithSubcategories(): Promise<any> {
    try {
         console.log("getCategoriesWithSubcategories");
          const query = `SELECT
                              c.id as category_id,
                              c.name as category_name,
                              sc.id as subcategory_id,
                              sc.name as subcategory_name,
                              sc.image_url
                              FROM categories c
                              LEFT JOIN 
                              subcategories sc ON 
                              c.id = sc.category_id
                              ORDER BY c.id DESC
                          `;
          const result : any = await this.db.query(query);
          const finalResult = await transformCategories(result);
          return { data: finalResult };
    } catch (error) {
      console.error('Error fetching categories with subcategories:', error);
      throw new InternalServerErrorException('Failed to fetch categories with subcategories');
    }
  }

  /**
   * Update a category and its subcategories.
   * Payload: { category, categoryId, subcategories: [{ subcategoryId?, name, image }] }.
   * - Updates category name. For each subcategory: update if subcategoryId present, else insert.
   * - Removes subcategories that belong to this category but are not in the payload.
   */
  async updateCategory(
    category: string,
    categoryId: number,
    subcategories: Array<{ subcategoryId?: number; name: string; image?: string }>,
  ): Promise<{ message: string }> {
    try {
      const id = Number(categoryId);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Valid categoryId is required');
      }
      if (!category || !category.trim()) {
        throw new BadRequestException('category name is required');
      }
      const existing = await this.db.query<Array<{ id: number }>>(
        'SELECT id FROM categories WHERE id = ? LIMIT 1',
        [id],
      );
      if (!Array.isArray(existing) || existing.length === 0) {
        throw new BadRequestException('Category not found');
      }
      await this.db.query('UPDATE categories SET name = ? WHERE id = ?', [category.trim(), id]);

      const list = Array.isArray(subcategories) ? subcategories : [];
      const keepSubIds: number[] = [];

      for (const sub of list) {
        const name = sub?.name?.trim();
        if (!name) continue;
        const image = sub?.image ?? null;
        const subId = sub?.subcategoryId != null ? Number(sub.subcategoryId) : null;
        if (subId != null && Number.isInteger(subId) && subId > 0) {
          await this.db.query(
            'UPDATE subcategories SET name = ?, image_url = ? WHERE id = ? AND category_id = ?',
            [name, image, subId, id],
          );
          keepSubIds.push(subId);
        } else {
          const insertResult = (await this.db.query(
            'INSERT INTO subcategories (name, category_id, image_url, is_main) VALUES (?, ?, ?, 0)',
            [name, id, image],
          )) as { insertId?: number };
          const newId = insertResult?.insertId;
          if (newId) keepSubIds.push(newId);
        }
      }

      // Remove subcategories that belong to this category but are not in the payload
      if (keepSubIds.length > 0) {
        const placeholders = keepSubIds.map(() => '?').join(', ');
        console.log("placeholders: ", placeholders);
        await this.db.query(
          `DELETE FROM subcategories WHERE category_id = ? AND id NOT IN (${placeholders})`,
          [id, ...keepSubIds],
        );
      } else {
        await this.db.query('DELETE FROM subcategories WHERE category_id = ?', [id]);
        console.log("Deleted all subcategories for category: ", id);
      }

      return { message: 'Category and subcategories updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error updating category:', error);
      throw new InternalServerErrorException('Failed to update category');
    }
  }

  // Delete a category and all its subcategories
  async deleteCategory(categoryId: number, subcategoryId: number, isCategory: boolean): Promise<{ message: string }> {
    try {
      if ((!categoryId || categoryId === 0) && (!subcategoryId || subcategoryId === 0)) {
         throw new BadRequestException('Valid categoryId or subcategoryId is required');
      }
      if(isCategory) {
        const existing = await this.db.query<Array<{ id: number }>>(
          'SELECT id FROM categories WHERE id = ? LIMIT 1',
          [categoryId],
        );
        if (!Array.isArray(existing) || existing.length === 0) {
          throw new BadRequestException('Category not found');
        }
        await this.db.query('DELETE FROM subcategories WHERE category_id = ?', [categoryId]);
        await this.db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
        return { message: 'Category deleted successfully' };
      }else{
        const existing = await this.db.query<Array<{ id: number }>>(
          'SELECT id FROM subcategories WHERE id = ? LIMIT 1',
          [subcategoryId],
        );
        if (!Array.isArray(existing) || existing.length === 0) {
          throw new BadRequestException('Subcategory not found');
        }
        await this.db.query('DELETE FROM subcategories WHERE id = ?', [subcategoryId]);
      }
      return { message: `${isCategory ? 'Category' : 'Subcategory'} deleted successfully` }; 
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error deleting category:', error);
      throw new InternalServerErrorException('Failed to delete category');
    }
  }

  /** Get subcategories (grouped as categories), popular businesses (max 5), recent businesses (max 5). */
  async getAllSubcategories(): Promise<{
    subcategories: any[];
    popular_businesses: any[];
    recent_businesses: any[];
  }> {
    try {
      const subcatRows = await this.db.query<any[]>(
        `SELECT
              sc.id AS subcategory_id,
              sc.name AS subcategory_name,
              sc.image_url
        FROM subcategories sc
        ORDER BY sc.created_at ASC
        LIMIT 15`,
      );
      const subcategories = Array.isArray(subcatRows) ? subcatRows  : [];
      const businessSelect = `SELECT
              b.id AS business_id,
              b.business_name AS business_name,
              b.address AS address,
              b.about_us AS about_us,
              b.services_offered AS services_offered,
              b.gallery AS gallery,
              b.is_verified AS is_verified,
              b.is_popular AS is_popular,
              b.is_recent AS is_recent,
              u.phoneno as phone_no
        FROM businesses b
        LEFT JOIN users u ON b.user_id = u.id`
      const popularRows = await this.db.query<any[]>(
        `${businessSelect} WHERE b.is_popular = 1 AND is_verified = 1 ORDER BY b.id DESC`,
      );
      const recentRows = await this.db.query<any[]>(
        `${businessSelect} WHERE b.is_recent = 1 AND is_verified = 1 ORDER BY b.id DESC`,
      );

      const mapBusinessRow = (row: any) => {
        let gallery = row?.gallery;
        if (typeof gallery === 'string') {
          try {
            gallery = JSON.parse(gallery);
          } catch {
            gallery = [];
          }
        }
        if (!Array.isArray(gallery)) gallery = [];
        let services_offered = row?.services_offered;
        if (typeof services_offered === 'string') {
          try {
            services_offered = JSON.parse(services_offered);
          } catch {
            services_offered = [];
          }
        }
        if (!Array.isArray(services_offered)) services_offered = [];
        return { ...row, gallery, services_offered };
      };

      const popular_businesses = (Array.isArray(popularRows) ? popularRows : []).map(mapBusinessRow);
      const recent_businesses = (Array.isArray(recentRows) ? recentRows : []).map(mapBusinessRow);

      return {
        subcategories,
        popular_businesses,
        recent_businesses,
      };
    } catch (error) {
      console.error('Error in getAllSubcategories:', error);
      throw new InternalServerErrorException('Failed to fetch subcategories and businesses');
    }
  }

  async getBusinessById(businessId : number): Promise<any> {
    try{
      console.log("businessId: ", businessId);
      const query = `
                      SELECT 
                      businesses.*,
                      users.phoneno as phone_no
                      FROM businesses
                      LEFT JOIN users ON businesses.user_id = users.id
                      where businesses.id = ?     
                    `
      const result : any = await this.db.query(query, [businessId]);

      if(result.length === 0){
        throw new BadRequestException('Business not found');
      }

      const gallery = result[0].gallery;
      if(typeof gallery === 'string'){
        try{
          result[0].gallery = JSON.parse(gallery);
        }catch(error){
          result[0].gallery = [];
        }
      }
      if(typeof result[0].services_offered === 'string'){
        try{
          result[0].services_offered = JSON.parse(result[0].services_offered);
        }catch(error){
          result[0].services_offered = [];
        }
      }
      const similarBusinesses = await this.db.query<any[]>(
        `SELECT 
              businesses.id as business_id,
              businesses.business_name as business_name,
              businesses.address as address,
              businesses.gallery as gallery,
              users.phoneno as phone_no
        FROM businesses
        LEFT JOIN users ON businesses.user_id = users.id
        WHERE businesses.category_id = ? AND businesses.id != ? AND businesses.is_verified = 1 ORDER BY businesses.id DESC LIMIT 5`,
        [result[0].category_id, businessId],
      );
      if(similarBusinesses.length > 0){
        for(const business of similarBusinesses){
          if(typeof business.gallery === 'string'){
            try{
              business.gallery = JSON.parse(business.gallery);
            }catch(error){
              business.gallery = [];
            }
          }
        }
      }
      console.log("similarBusinesses: ", similarBusinesses);
      return { data: result[0], similar_businesses: similarBusinesses};
    }catch(error){
      console.error('Error in getBusiness:', error);
      throw new InternalServerErrorException('Failed to fetch business');
    }
  }

  /**
   * Search businesses by category and/or subcategory name.
   * Payload: { cat?: string, subcat?: string } — at least one required.
   * Resolves category/subcategory IDs from names, then returns businesses with business_id, business_name, address, gallery, phone_no.
   */
  async searchBusinessesByCategoryOrSubcategory(payload: { cat?: string; subcat?: string }): Promise<{
    businesses: Array<{
      business_id: number;
      business_name: string;
      address: string;
      gallery: string[];
      phone_no: string | null;
    }>;
  }> {
    console.log("payload: ", payload);
    const { cat, subcat } = payload ?? {};
    console.log("cat: ", cat);
    console.log("subcat: ", subcat);
    const hasCat = cat != null && String(cat).trim() !== '';
    console.log("hasCat: ", String(cat));
    const hasSubcat = subcat != null && String(subcat).trim() !== '';
    if (!hasCat && !hasSubcat) {
      throw new BadRequestException('At least one of cat or subcat is required');
    }
    let categoryIds: number[] = [];
    let subcategoryIds: number[] = [];
    console.log("hasCat: ", hasCat);
    if (hasCat) {
      const catRows = await this.db.query<{ id: number }[]>(
        'SELECT id FROM categories WHERE name LIKE ?',
        [`%${String(cat).toLowerCase().trim()}%`],
      );
      categoryIds = (catRows ?? []).map((r) => r.id);
    }
    console.log("categoryIds: ", categoryIds);
    if (hasSubcat) {
      const subcatRows = await this.db.query<{ id: number }[]>(
        'SELECT id FROM subcategories WHERE name LIKE ?',
        [`%${String(subcat).toLowerCase().trim()}%`],
      );
      subcategoryIds = (subcatRows ?? []).map((r) => r.id);
    }
    console.log("subcategoryIds: ", subcategoryIds);

    const hasCategoryIds = categoryIds.length > 0;
    const hasSubcategoryIds = subcategoryIds.length > 0;
    if (!hasCategoryIds && !hasSubcategoryIds) {
      return { businesses: [] };
    }
    const conditions: string[] = [];
    const params: number[] = [];
    if (hasCategoryIds) {
      const placeholders = categoryIds.map(() => '?').join(', ');
      conditions.push(`businesses.category_id IN (${placeholders})`);
      params.push(...categoryIds);
    }
    if (hasSubcategoryIds) {
      const placeholders = subcategoryIds.map(() => '?').join(', ');
      conditions.push(`businesses.subcategory_id IN (${placeholders})`);
      params.push(...subcategoryIds);
    }
    const whereClause = conditions.join(' OR ');
    console.log("whereClause: ", whereClause);
    const rows = await this.db.query<any[]>(
      `SELECT 
        businesses.id as business_id,
        businesses.business_name as business_name,
        businesses.address as address,
        businesses.gallery as gallery,
        users.phoneno as phone_no
      FROM businesses
      LEFT JOIN users ON businesses.user_id = users.id
      WHERE (${whereClause}) AND businesses.is_verified = 1
      ORDER BY businesses.id DESC`,
      params,
    );

    const businesses = (rows ?? []).map((row) => {
      let gallery = row.gallery;
      if (typeof gallery === 'string') {
        try {
          gallery = JSON.parse(gallery);
        } catch {
          gallery = [];
        }
      }
      if (!Array.isArray(gallery)) gallery = [];
      return {
        business_id: row.business_id,
        business_name: row.business_name,
        address: row.address,
        gallery,
        phone_no: row.phone_no ?? null,
      };
    });
    console.log("businesses: ", businesses);
    return { businesses };
  }
}

async function transformCategories(result : any) {
  console.log("result: ", result);
  const categoryMap = {} as any;

  result.forEach((row : any) => {
    if (!categoryMap[row.category_id]) {
      categoryMap[row.category_id] = {
        category_id: row.category_id,
        category_name: row.category_name,
        subcategories: []
      }; 
    }
    if(row.subcategory_id) {
      categoryMap[row.category_id].subcategories.push({
        subcategory_id: row.subcategory_id,
        subcategory_name: row.subcategory_name,
        image_url: row.image_url
      });
    }
  });
  return Object.values(categoryMap);
}