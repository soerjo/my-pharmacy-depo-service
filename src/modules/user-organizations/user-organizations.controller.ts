import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('UserOrganizations')
@Controller('user-organizations')
export class UserOrganizationsController {
  @Get('status')
  status() {
    return { message: 'UserOrganizations module not yet implemented' };
  }
}
