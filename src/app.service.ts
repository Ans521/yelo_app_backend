import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {

  async checkDatabase(): Promise<{ ok: boolean; message: string; error?: string }> {
    // your DB check logic
    console.log('Checking database...');
    return { ok: true, message: 'DB connected' };
  }

  async onModuleInit() {
    const result = await this.checkDatabase();
    console.log('DB CHECK:', result);
  }
}