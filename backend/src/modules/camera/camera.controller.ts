import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CameraService } from './camera.service';
import { GateService } from '../gate/gate.service';
import { ImageService } from '../image/image.service';
import { CreateCameraDto, UpdateCameraDto } from './dto/camera.dto';
import { CameraEventDto, MovementType } from './dto/camera-event.dto';
import { GateDirection } from '../gate/dto/gate-event.dto';
import { Camera } from '../../common/entities/camera.entity';

@ApiTags('camera')
@Controller('camera')
export class CameraController {
  private readonly logger = new Logger(CameraController.name);

  constructor(
    private readonly cameraService: CameraService,
    private readonly gateService: GateService,
    private readonly imageService: ImageService,
  ) {}

  @Post('event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive ANPR camera event', description: 'Endpoint for ANPR cameras to send vehicle detection events' })
  @ApiBody({ type: CameraEventDto })
  @ApiResponse({ status: 200, description: 'Event processed successfully' })
  async handleCameraEvent(@Body() dto: CameraEventDto) {
    return this.processEvent(dto);
  }

  @Post('events/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive bulk ANPR camera events', description: 'Endpoint for batch processing multiple camera events' })
  @ApiBody({ type: [CameraEventDto] })
  @ApiResponse({ status: 200, description: 'Events processed successfully' })
  async handleBulkCameraEvents(@Body() events: CameraEventDto[]) {
    this.logger.log(`Bulk Camera Events: ${events.length} events received`);
    
    const results = [];
    for (const dto of events) {
      try {
        const result = await this.processEvent(dto);
        results.push({ success: true, vehicleNumber: dto.registrationNumber, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          vehicleNumber: dto.registrationNumber, 
          error: error.message 
        });
      }
    }

    return {
      success: true,
      total: events.length,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  @Post('event/upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Receive ANPR camera event with file upload', 
    description: 'Endpoint for ANPR cameras to send vehicle detection events with image file upload' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cameraId: { type: 'string', example: '1' },
        registrationNumber: { type: 'string', example: 'MH12AB1234' },
        movementType: { type: 'string', enum: ['IN', 'OUT'], example: 'IN' },
        time: { type: 'string', format: 'date-time', example: '2025-12-16T10:30:00.000Z' },
        vehicleType: { type: 'string', example: 'Car' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['cameraId', 'registrationNumber', 'movementType', 'time'],
    },
  })
  @ApiResponse({ status: 200, description: 'Event processed successfully' })
  async handleCameraEventUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { cameraId: string; registrationNumber: string; movementType: string; time: string; vehicleType?: string },
  ) {
    this.logger.log(`Camera Event Upload: ${body.cameraId} - ${body.registrationNumber} - ${body.movementType}`);

    // Convert uploaded file to base64 data URL
    let imageBase64: string | undefined;
    if (file) {
      const mimeType = file.mimetype || 'image/png';
      const base64Data = file.buffer.toString('base64');
      imageBase64 = `data:${mimeType};base64,${base64Data}`;
    }

    // Create DTO and process
    const dto: CameraEventDto = {
      cameraId: body.cameraId,
      registrationNumber: body.registrationNumber,
      movementType: body.movementType as MovementType,
      time: body.time,
      vehicleType: body.vehicleType,
      image: imageBase64,
    };

    return this.processEvent(dto);
  }

  private async processEvent(dto: CameraEventDto) {
    this.logger.log(`Camera Event: ${dto.cameraId} - ${dto.registrationNumber} - ${dto.movementType}`);

    // Save image to separate table if provided
    let imageId: string | undefined;
    if (dto.image) {
      const savedImage = await this.imageService.create({
        data: dto.image,
        vehicleNumber: dto.registrationNumber.toUpperCase().replace(/\s/g, ''),
        cameraId: dto.cameraId,
        eventType: dto.movementType,
        capturedAt: new Date(dto.time),
      });
      imageId = savedImage.id;
    }

    // Convert to gate event format and process
    const direction = dto.movementType === MovementType.IN ? GateDirection.IN : GateDirection.OUT;
    
    const result = await this.gateService.handleGateEvent({
      vehicleNumber: dto.registrationNumber,
      direction,
      isTestDrive: false,
    }, {
      cameraId: dto.cameraId,
      vehicleType: dto.vehicleType,
      imageId,
      image: dto.image,
      eventTime: new Date(dto.time),
    });

    return {
      ...result,
      cameraId: dto.cameraId,
      timestamp: dto.time,
      imageId,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all cameras' })
  @ApiResponse({ status: 200, description: 'List of cameras' })
  async findAll(): Promise<Camera[]> {
    return this.cameraService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get camera by ID' })
  @ApiResponse({ status: 200, description: 'Camera details' })
  async findOne(@Param('id') id: string): Promise<Camera> {
    return this.cameraService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new camera' })
  @ApiBody({ type: CreateCameraDto })
  @ApiResponse({ status: 201, description: 'Camera created' })
  async create(@Body() dto: CreateCameraDto): Promise<Camera> {
    return this.cameraService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update camera' })
  @ApiBody({ type: UpdateCameraDto })
  @ApiResponse({ status: 200, description: 'Camera updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateCameraDto): Promise<Camera> {
    return this.cameraService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete camera' })
  @ApiResponse({ status: 204, description: 'Camera deleted' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.cameraService.delete(id);
  }

  @Post(':id/regenerate-token')
  @ApiOperation({ summary: 'Regenerate camera API token' })
  @ApiResponse({ status: 200, description: 'New token generated' })
  async regenerateToken(@Param('id') id: string): Promise<Camera> {
    return this.cameraService.regenerateToken(id);
  }
}
