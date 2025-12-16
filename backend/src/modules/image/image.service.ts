import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '../../common/entities/image.entity';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private imageRepo: Repository<Image>,
  ) {}

  async create(data: {
    data: string;
    vehicleNumber?: string;
    cameraId?: string;
    eventType?: string;
    capturedAt?: Date;
  }): Promise<Image> {
    const image = this.imageRepo.create(data);
    return this.imageRepo.save(image);
  }

  async findById(id: string): Promise<Image | null> {
    return this.imageRepo.findOne({ where: { id } });
  }

  async findByVehicle(vehicleNumber: string, limit = 10): Promise<Image[]> {
    return this.imageRepo.find({
      where: { vehicleNumber },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
