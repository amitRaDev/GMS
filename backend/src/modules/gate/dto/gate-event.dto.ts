import { IsString, IsEnum, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GateDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export class GateEventDto {
  @ApiProperty({ example: 'MH12AB1234', description: 'Vehicle registration number' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @ApiProperty({ enum: GateDirection, example: 'IN', description: 'Gate direction' })
  @IsEnum(GateDirection)
  direction: GateDirection;

  @ApiPropertyOptional({ example: false, description: 'Flag for test drive exits' })
  @IsOptional()
  @IsBoolean()
  isTestDrive?: boolean;
}
