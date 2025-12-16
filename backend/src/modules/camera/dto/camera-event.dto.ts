import { IsString, IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export class CameraEventDto {
  @ApiProperty({ example: '1', description: 'Camera identifier' })
  @IsString()
  @IsNotEmpty()
  cameraId: string;

  @ApiProperty({ example: 'MH12AB1234', description: 'Vehicle registration number from ANPR' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({ enum: MovementType, example: 'IN', description: 'Movement direction' })
  @IsEnum(MovementType)
  movementType: MovementType;

  @ApiProperty({ example: '2025-12-23T10:30:00.000Z', description: 'Event timestamp' })
  @IsDateString()
  time: string;

  @ApiPropertyOptional({ example: 'Car', description: 'Type of vehicle detected' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'data:image/png;base64,...', description: 'Base64 encoded image' })
  @IsOptional()
  @IsString()
  image?: string;
}
