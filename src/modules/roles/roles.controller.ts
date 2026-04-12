import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  @Get('status')
  status() {
    return { message: 'Roles module not yet implemented' };
  }
}
