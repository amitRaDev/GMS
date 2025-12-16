import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { Vehicle } from '../../common/entities';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({ status: 200, description: 'List of all vehicles' })
  findAll() {
    return this.vehicleService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search vehicle by number' })
  @ApiQuery({ name: 'number', description: 'Vehicle registration number' })
  @ApiResponse({ status: 200, description: 'Vehicle found' })
  findByNumber(@Query('number') number: string) {
    return this.vehicleService.findByNumber(number);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle details' })
  findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created' })
  create(@Body() data: Partial<Vehicle>) {
    return this.vehicleService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle updated' })
  update(@Param('id') id: string, @Body() data: Partial<Vehicle>) {
    return this.vehicleService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted' })
  delete(@Param('id') id: string) {
    return this.vehicleService.delete(id);
  }
}
