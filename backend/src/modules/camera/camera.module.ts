import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camera } from '../../common/entities/camera.entity';
import { CameraService } from './camera.service';
import { CameraController } from './camera.controller';
import { GateModule } from '../gate/gate.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Camera]),
    forwardRef(() => GateModule),
  ],
  controllers: [CameraController],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
