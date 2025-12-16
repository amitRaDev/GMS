import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GateService, GateResponse } from './gate.service';
import { GateEventDto } from './dto/gate-event.dto';

@ApiTags('gate')
@Controller('gate')
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Post('event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle ANPR gate event', description: 'Main endpoint for ANPR camera payload' })
  @ApiBody({ type: GateEventDto })
  @ApiResponse({ status: 200, description: 'Gate event processed successfully' })
  async handleGateEvent(@Body() dto: GateEventDto): Promise<GateResponse> {
    return this.gateService.handleGateEvent(dto);
  }

  @Post('confirm-entry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm vehicle entry', description: 'Operator approves vehicle entry after popup' })
  @ApiBody({ schema: { properties: { vehicleNumber: { type: 'string', example: 'MH12AB1234' } } } })
  @ApiResponse({ status: 200, description: 'Entry confirmed' })
  async confirmEntry(@Body() body: { vehicleNumber: string }): Promise<GateResponse> {
    return this.gateService.confirmEntry(body.vehicleNumber);
  }

  @Post('confirm-exit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm vehicle exit', description: 'Operator approves vehicle exit after popup' })
  @ApiBody({ schema: { properties: { vehicleNumber: { type: 'string' }, isTestDrive: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'Exit confirmed' })
  async confirmExit(@Body() body: { vehicleNumber: string; isTestDrive?: boolean }): Promise<GateResponse> {
    return this.gateService.confirmExit(body.vehicleNumber, body.isTestDrive);
  }

  @Post('force-close/:jobCardId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force close job card', description: 'Close job when operator confirms vehicle leaving alert' })
  @ApiResponse({ status: 200, description: 'Job closed successfully' })
  async forceCloseJob(@Param('jobCardId') jobCardId: string): Promise<GateResponse> {
    return this.gateService.forceCloseJob(jobCardId);
  }
}
