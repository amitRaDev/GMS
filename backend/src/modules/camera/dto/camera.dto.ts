import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCameraDto {
  @ApiProperty({ example: 'CAM-001', description: 'Unique camera identifier' })
  @IsString()
  @IsNotEmpty()
  cameraId: string;

  @ApiProperty({ example: 'Main Gate Camera', description: 'Camera name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Front entrance', description: 'Camera location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: ['IN', 'OUT', 'BOTH'], example: 'IN', description: 'Gate type' })
  @IsOptional()
  @IsEnum(['IN', 'OUT', 'BOTH'])
  gateType?: 'IN' | 'OUT' | 'BOTH';

  @ApiPropertyOptional({ description: 'Camera description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCameraDto {
  @ApiPropertyOptional({ example: 'Main Gate Camera', description: 'Camera name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Front entrance', description: 'Camera location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: ['IN', 'OUT', 'BOTH'], description: 'Gate type' })
  @IsOptional()
  @IsEnum(['IN', 'OUT', 'BOTH'])
  gateType?: 'IN' | 'OUT' | 'BOTH';

  @ApiPropertyOptional({ description: 'Camera active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Camera description' })
  @IsOptional()
  @IsString()
  description?: string;
}
