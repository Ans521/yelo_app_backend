import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mysql = require('mysql2/promise');

/**
 * Manual MySQL connection using mysql2 pool (no ORM).
 * Inject this service and use .query() for raw SQL.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: ReturnType<typeof mysql.createPool>;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('DB_HOST') ?? 'localhost';
    const port = parseInt(this.configService.get<string>('DB_PORT') ?? '3306', 10);
    const user = this.configService.get<string>('DB_USERNAME') ?? 'root';
    const password = this.configService.get<string>('DB_PASSWORD') ?? '';
    const database = this.configService.get<string>('DB_DATABASE') ?? 'yelo_backend';

    this.pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  onModuleDestroy() {
    this.pool.end();
  }

  /**
   * Run raw SQL. Use ? for params to avoid SQL injection.
   * @example await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
   */
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params ?? []);
    return rows as T;
  }

  /** Get the underlying pool if you need getConnection() / transactions. */
  getPool() {
    return this.pool;
  }
}
