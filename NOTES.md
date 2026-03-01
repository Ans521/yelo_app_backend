# NestJS project – quick reference

Use this when you forget the syntax. Copy-paste and rename.

---

## 1. Add a new POST route (controller + service)

**Controller** (`src/core/app-core.controller.ts` or your module’s controller):

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Post('your-path')   // e.g. 'add-business' → POST /api/add-business
async yourMethod(@Body() dto: YourDto) {
  return this.yourService.yourMethod(dto);
}
```

**Service** (same module’s service, e.g. `app-core.service.ts`):

```ts
async yourMethod(dto: YourDto) {
  // your logic, e.g. this.db.query(...)
  return { message: 'Done' };
}
```

- Controller = **route** (URL + method).
- Service = **logic** (DB, calls, etc.). Inject with `constructor(private readonly yourService: YourService) {}`.

---

## 2. Get the logged-in user (userId, email) in a route

Auth middleware sets `req.user` for every request **except** `POST /otp/get-otp` and `POST /otp/verify-otp`.

**In a controller:**

```ts
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Get('me')
me(@Req() req: Request) {
  const userId = req.user!.userId;
  const email = req.user!.email;
  return { userId, email };
}
```

**In a service:** pass them from the controller:

```ts
// Controller
this.appCoreService.doSomething(dto, req.user!.userId, req.user!.email);

// Service
async doSomething(dto: SomeDto, userId: number, email: string) { ... }
```

**Check that the user still exists in DB** (e.g. after token is valid):

```ts
// Inject AppCoreService, then:
const user = await this.appCoreService.authenticateUser(req.user!.email);
// user is { id, email }; throws UnauthorizedException if not in DB
```

---

## 3. Upload images and get URLs (common function)

- **Upload folder:** `upload/` at project root. Files are saved there by Multer.
- **Multer config:** `src/core/multer-upload.config.ts` – field name `business_images`, up to 100 files, 10 MB each, saved with random filename in `upload/`.
- **Common function:** `this.appCoreService.getUploadedImageUrls(files, baseUrl)`  
  - Pass the array from `@UploadedFiles()` and `baseUrl` (e.g. `req.protocol + '://' + req.get('host')`).  
  - Returns an array of URLs like `http://localhost:3050/upload/abc123.jpg` that you can store in DB (e.g. `gallery`).
- **Serving files:** Static files under `upload/` are served at `/upload/*` (configured in `main.ts`).
- **add-business:** Send `multipart/form-data` with field `business` (JSON string of business data) and `business_images` (array of files). The endpoint builds `gallery` from uploaded files and saves it with the business.

---

## 4. Run a database query

Inject `DatabaseService` in your service, then:

```ts
// SELECT (returns array of rows)
const rows = await this.db.query<{ id: number; name: string }[]>(
  'SELECT id, name FROM users WHERE email = ?',
  [email],
);
const first = rows?.[0];

// INSERT (returns result with insertId in some drivers)
await this.db.query(
  'INSERT INTO businesses (user_id, business_name, ...) VALUES (?, ?, ...)',
  [userId, dto.business_name, ...],
);
```

- Use `?` for values; pass params in the second argument (avoids SQL injection).
- For JSON columns (e.g. `services_offered`, `gallery`), pass `JSON.stringify(array)`.

---

## 5. Add a new DTO and use it in `@Body()`

**Create DTO** (e.g. `src/core/dto/your.dto.ts`):

```ts
import { IsString, IsInt, IsOptional } from 'class-validator';

export class YourDto {
  @IsString()
  name: string;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsString()
  note?: string;
}
```

**Use in controller:**

```ts
import { YourDto } from './dto/your.dto';

@Post('your-path')
async yourMethod(@Body() dto: YourDto) {
  return this.yourService.yourMethod(dto);
}
```

Validation runs automatically (ValidationPipe). Invalid body → 400 before your code runs.

---

## 6. Project layout (where things live)

| What              | Where |
|-------------------|--------|
| Routes (API)      | `src/*/*.controller.ts` (e.g. `otp.controller.ts`, `app-core.controller.ts`) |
| Business logic    | `src/*/*.service.ts` |
| DTOs (body types) | `src/*/dto/*.dto.ts` |
| Auth middleware  | `src/middleware/auth.middleware.ts` – runs on all routes except below |
| App wiring       | `src/app.module.ts` (imports, auth exclude list) |
| DB access        | `DatabaseService` in `src/database/database.service.ts` (inject in any service) |

**Route prefixes:**

- `@Controller('otp')`  → routes under `/otp/...` (e.g. `/otp/get-otp`, `/otp/verify-otp`).
- `@Controller('api')`  → routes under `/api/...` (e.g. `/api/add-business`).

---

## 7. Routes that do NOT require auth (no token)

- `POST /otp/get-otp`
- `POST /otp/verify-otp`

All other routes need header: `Authorization: Bearer <token>` (token you get from `verify-otp` response).

---

## 8. .env (reminder)

```
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=...
DB_DATABASE=yelo_backend
JWT_SECRET=your-secret-here
# ... mail, redis, etc. as you use them
```

---

## 9. Add a new “feature” (new module)

1. Create folder, e.g. `src/products/`.
2. Add `products.controller.ts`, `products.service.ts`, `products.module.ts`.
3. In `products.module.ts`: put `ProductsController` in `controllers`, `ProductsService` in `providers`. Import `DatabaseModule` (or use global) if you need DB.
4. In `app.module.ts`: add `ProductsModule` to `imports`.

Then add routes in the controller and logic in the service (same pattern as above).

---

You don’t need to memorize this – use it as a copy-paste reference and adjust names.
