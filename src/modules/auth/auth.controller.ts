import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
@Public()
export class AuthController {
  @Get('status')
  status() {
    return { message: 'Auth module not yet implemented' };
  }
}
