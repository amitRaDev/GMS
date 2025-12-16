import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GateLog } from '../../common/entities';
import { GateLogService } from './gate-log.service';
import { GateLogController } from './gate-log.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GateLog])],
  providers: [GateLogService],
  controllers: [GateLogController],
  exports: [GateLogService],
})
export class GateLogModule {}
