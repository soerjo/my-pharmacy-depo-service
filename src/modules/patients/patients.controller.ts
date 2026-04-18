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
import { PatientsService } from './patients.service.js';
import { CreatePatientDto, UpdatePatientDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';
import { PaginationDto, SearchDto } from '../../common/dto/pagination.dto.js';

@ApiBearerAuth()
@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create patient' })
  create(
    @Body() dto: CreatePatientDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.patientsService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List patients' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query() pagination: PaginationDto,
    @Query() searchDto: SearchDto,
    @Query('isActive') isActive?: string,
  ) {
    return this.patientsService.findAll(
      organizationId,
      pagination,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      searchDto.search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.patientsService.findOne(id, organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.patientsService.update(id, dto, organizationId);
  }

  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Deactivate patient' })
  // remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
  //   return this.patientsService.remove(id, organizationId);
  // }
}
