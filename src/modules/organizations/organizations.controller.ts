import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  @Get('status')
  status() {
    return { message: 'Organizations module not yet implemented' };
  }
}
