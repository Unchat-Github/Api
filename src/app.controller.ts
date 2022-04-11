import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  sendMessage() {
    return { code: 200, message: 'What you lookin at? 👀' };
  }
}
