import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GateLog, GateEventType, GateDirection } from '../../common/entities';

export interface CreateGateLogDto {
  vehicleNumber: string;
  eventType: GateEventType;
  direction?: GateDirection;
  jobNumber?: string;
  previousStatus?: string;
  newStatus?: string;
  message?: string;
  hasJobCard?: boolean;
  actionTaken?: boolean;
  vehicleId?: string;
  jobCardId?: string;
  cameraId?: string;
  vehicleType?: string;
  imageId?: string;
  eventTime?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GateLogService {
  constructor(
    @InjectRepository(GateLog)
    private gateLogRepo: Repository<GateLog>,
  ) {}

  async create(dto: CreateGateLogDto): Promise<GateLog> {
    const log = this.gateLogRepo.create(dto);
    return this.gateLogRepo.save(log);
  }

  async findAll(
    page = 1,
    limit = 20,
    vehicleNumber?: string,
    eventType?: GateEventType,
  ): Promise<PaginatedResult<GateLog>> {
    const query = this.gateLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.vehicle', 'vehicle')
      .leftJoinAndSelect('log.jobCard', 'jobCard')
      .leftJoinAndSelect('log.image', 'image')
      .orderBy('log.createdAt', 'DESC');

    if (vehicleNumber) {
      query.andWhere('log.vehicleNumber LIKE :vehicleNumber', {
        vehicleNumber: `%${vehicleNumber}%`,
      });
    }

    if (eventType) {
      query.andWhere('log.eventType = :eventType', { eventType });
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);

    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit, totalPages };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEntries = await this.gateLogRepo.count({
      where: { eventType: GateEventType.ENTRY_ALLOWED },
    });

    const totalExits = await this.gateLogRepo.count({
      where: { eventType: GateEventType.EXIT_ALLOWED },
    });

    const todayEntries = await this.gateLogRepo
      .createQueryBuilder('log')
      .where('log.eventType = :type', { type: GateEventType.ENTRY_ALLOWED })
      .andWhere('log.createdAt >= :today', { today })
      .getCount();

    const todayExits = await this.gateLogRepo
      .createQueryBuilder('log')
      .where('log.eventType = :type', { type: GateEventType.EXIT_ALLOWED })
      .andWhere('log.createdAt >= :today', { today })
      .getCount();

    return { totalEntries, totalExits, todayEntries, todayExits };
  }
}
