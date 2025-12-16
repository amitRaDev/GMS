import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobCard, Vehicle } from '../../common/entities';
import { JobCardController } from './job-card.controller';
import { JobCardService } from './job-card.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobCard, Vehicle])],
  controllers: [JobCardController],
  providers: [JobCardService],
  exports: [JobCardService],
})
export class JobCardModule {}
