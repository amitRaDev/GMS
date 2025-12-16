import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GateLogService } from './gate-log.service';
import { GateEventType } from '../../common/entities';

@ApiTags('gate-logs')
@Controller('gate-logs')
export class GateLogController {
  constructor(private readonly gateLogService: GateLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get gate logs with pagination', description: 'Returns paginated gate event history' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'vehicleNumber', required: false, description: 'Filter by vehicle number' })
  @ApiQuery({ name: 'eventType', required: false, enum: GateEventType, description: 'Filter by event type' })
  @ApiResponse({ status: 200, description: 'Paginated gate logs' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vehicleNumber') vehicleNumber?: string,
    @Query('eventType') eventType?: GateEventType,
  ) {
    return this.gateLogService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      vehicleNumber,
      eventType,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get gate statistics', description: 'Returns entry/exit counts for today and total' })
  @ApiResponse({ status: 200, description: 'Gate statistics' })
  async getStats() {
    return this.gateLogService.getStats();
  }
}
