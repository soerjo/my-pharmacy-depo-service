import { Module } from '@nestjs/common';
import { UserOrganizationsController } from './user-organizations.controller.js';

@Module({
  controllers: [UserOrganizationsController],
})
export class UserOrganizationsModule {}
