import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdmissionsService } from './admissions.service.js';
import {
  CreateAdmissionDto,
  UpdateAdmissionDto,
  QueryAdmissionDto,
} from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Admissions')
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create admission' })
  create(
    @Body() dto: CreateAdmissionDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.admissionsService.create(dto, organizationId);
  }

  @Post('/discharge/:id')
  @ApiOperation({ summary: 'Discharge patient' })
  discharge(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.admissionsService.discharge(id, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List admissions' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query() query: QueryAdmissionDto,
  ) {
    return this.admissionsService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admission by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.admissionsService.findOne(id, organizationId);
  }

  // @Put(':id')
  // @ApiOperation({ summary: 'Update admission' })
  // update(
  //   @Param('id') id: string,
  //   @Body() dto: UpdateAdmissionDto,
  //   @OrganizationId() organizationId: string,
  // ) {
  //   return this.admissionsService.update(id, dto, organizationId);
  // }

  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Delete admission' })
  // remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
  //   return this.admissionsService.remove(id, organizationId);
  // }
}
