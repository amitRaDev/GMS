import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../common/entities';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
  ) {}

  findAll() {
    return this.vehicleRepo.find({ relations: ['jobCards'] });
  }

  findOne(id: string) {
    return this.vehicleRepo.findOne({ where: { id }, relations: ['jobCards'] });
  }

  findByNumber(vehicleNumber: string) {
    return this.vehicleRepo.findOne({
      where: { vehicleNumber: vehicleNumber.toUpperCase().replace(/\s/g, '') },
      relations: ['jobCards'],
    });
  }

  create(data: Partial<Vehicle>) {
    const vehicle = this.vehicleRepo.create({
      ...data,
      vehicleNumber: data.vehicleNumber?.toUpperCase().replace(/\s/g, ''),
    });
    return this.vehicleRepo.save(vehicle);
  }

  async update(id: string, data: Partial<Vehicle>) {
    await this.vehicleRepo.update(id, data);
    return this.findOne(id);
  }

  delete(id: string) {
    return this.vehicleRepo.delete(id);
  }
}
