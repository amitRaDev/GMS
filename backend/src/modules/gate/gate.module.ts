import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GateController } from './gate.controller';
import { GateService } from './gate.service';
import { Vehicle, JobCard } from '../../common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, JobCard])],
  controllers: [GateController],
  providers: [GateService],
})
export class GateModule {}
