import { Controller, Get, Post, Put, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JobCardService } from './job-card.service';
import { JobCard } from '../../common/entities';
import { JobStatus } from '../../common/enums';

@ApiTags('job-cards')
@Controller('job-cards')
export class JobCardController {
  constructor(private readonly jobCardService: JobCardService) {}

  @Get()
  @ApiOperation({ summary: 'Get all job cards' })
  @ApiResponse({ status: 200, description: 'List of all job cards' })
  findAll() {
    return this.jobCardService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active job cards', description: 'Returns job cards that are not CLOSED' })
  @ApiResponse({ status: 200, description: 'List of active job cards' })
  findActive() {
    return this.jobCardService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job card by ID' })
  @ApiParam({ name: 'id', description: 'Job card UUID' })
  @ApiResponse({ status: 200, description: 'Job card details' })
  findOne(@Param('id') id: string) {
    return this.jobCardService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new job card' })
  @ApiBody({ schema: { properties: { vehicleNumber: { type: 'string' }, serviceDescription: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Job card created' })
  create(@Body() data: Partial<JobCard> & { vehicleNumber?: string }) {
    return this.jobCardService.create(data);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update job card status' })
  @ApiParam({ name: 'id', description: 'Job card UUID' })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: Object.values(JobStatus) } } } })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(@Param('id') id: string, @Body('status') status: JobStatus) {
    return this.jobCardService.updateStatus(id, status);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job card' })
  @ApiParam({ name: 'id', description: 'Job card UUID' })
  @ApiResponse({ status: 200, description: 'Job card updated' })
  update(@Param('id') id: string, @Body() data: Partial<JobCard>) {
    return this.jobCardService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job card' })
  @ApiParam({ name: 'id', description: 'Job card UUID' })
  @ApiResponse({ status: 200, description: 'Job card deleted' })
  delete(@Param('id') id: string) {
    return this.jobCardService.delete(id);
  }
}
