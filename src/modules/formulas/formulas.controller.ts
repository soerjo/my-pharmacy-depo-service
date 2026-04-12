import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FormulasService } from './formulas.service.js';
import { CreateFormulaDto, UpdateFormulaDto } from './dto/index.js';
import { OrganizationId } from '../../common/decorators/organization-id.decorator.js';

@ApiBearerAuth()
@ApiTags('Formulas')
@Controller('formulas')
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) {}

  @Post()
  @ApiOperation({ summary: 'Create a formula' })
  create(
    @Body() dto: CreateFormulaDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.formulasService.create(organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all formulas' })
  findAll(
    @OrganizationId() organizationId: string,
    @Query('isActive') isActive?: string,
    @Query('productId') productId?: string,
  ) {
    return this.formulasService.findAll(
      organizationId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      productId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a formula by ID' })
  findOne(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.formulasService.findOne(organizationId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a formula' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFormulaDto,
    @OrganizationId() organizationId: string,
  ) {
    return this.formulasService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a formula' })
  remove(@Param('id') id: string, @OrganizationId() organizationId: string) {
    return this.formulasService.remove(organizationId, id);
  }
}
