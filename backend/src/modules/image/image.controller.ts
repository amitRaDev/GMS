import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ImageService } from './image.service';

@ApiTags('images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get image by ID' })
  @ApiResponse({ status: 200, description: 'Image data' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async findOne(@Param('id') id: string) {
    const image = await this.imageService.findById(id);
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  @Get('vehicle/:vehicleNumber')
  @ApiOperation({ summary: 'Get images by vehicle number' })
  @ApiResponse({ status: 200, description: 'List of images' })
  async findByVehicle(@Param('vehicleNumber') vehicleNumber: string) {
    return this.imageService.findByVehicle(vehicleNumber);
  }
}
