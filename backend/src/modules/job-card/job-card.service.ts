import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { JobCard, Vehicle } from '../../common/entities';
import { JobStatus } from '../../common/enums';
import { GarageGateway } from '../websocket/garage.gateway';

@Injectable()
export class JobCardService {
  constructor(
    @InjectRepository(JobCard)
    private jobCardRepo: Repository<JobCard>,
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
    private gateway: GarageGateway,
  ) {}

  findAll() {
    return this.jobCardRepo.find({
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  findActive() {
    return this.jobCardRepo.find({
      where: { status: Not(In([JobStatus.CLOSED, JobStatus.COMPLETED])) },
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string) {
    return this.jobCardRepo.findOne({
      where: { id },
      relations: ['vehicle'],
    });
  }

  async create(data: Partial<JobCard> & { 
    vehicleNumber?: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    make?: string;
    model?: string;
    color?: string;
  }) {
    let vehicle: Vehicle;

    if (data.vehicleNumber) {
      const normalized = data.vehicleNumber.toUpperCase().replace(/\s/g, '');
      vehicle = await this.vehicleRepo.findOne({ where: { vehicleNumber: normalized } });

      if (!vehicle) {
        vehicle = this.vehicleRepo.create({ 
          vehicleNumber: normalized,
          ownerName: data.ownerName,
          ownerPhone: data.ownerPhone,
          ownerEmail: data.ownerEmail,
          make: data.make,
          model: data.model,
          color: data.color,
        });
        vehicle = await this.vehicleRepo.save(vehicle);
      } else {
        // Update vehicle details if provided
        if (data.ownerName || data.ownerPhone || data.ownerEmail || data.make || data.model || data.color) {
          if (data.ownerName) vehicle.ownerName = data.ownerName;
          if (data.ownerPhone) vehicle.ownerPhone = data.ownerPhone;
          if (data.ownerEmail) vehicle.ownerEmail = data.ownerEmail;
          if (data.make) vehicle.make = data.make;
          if (data.model) vehicle.model = data.model;
          if (data.color) vehicle.color = data.color;
          vehicle = await this.vehicleRepo.save(vehicle);
        }
      }
      data.vehicleId = vehicle.id;
    }

    const jobNumber = `JC-${Date.now().toString(36).toUpperCase()}`;
    const jobCard = this.jobCardRepo.create({ ...data, jobNumber, status: JobStatus.IDLE });
    return this.jobCardRepo.save(jobCard);
  }

  async updateStatus(id: string, status: JobStatus) {
    const jobCard = await this.findOne(id);
    if (!jobCard) throw new NotFoundException('Job card not found');

    const previousStatus = jobCard.status;
    jobCard.status = status;
    const saved = await this.jobCardRepo.save(jobCard);

    this.gateway.emitJobStatusChanged({
      jobCardId: id,
      jobNumber: jobCard.jobNumber,
      vehicleNumber: jobCard.vehicle.vehicleNumber,
      previousStatus,
      newStatus: status,
    });

    return saved;
  }

  async update(id: string, data: Partial<JobCard>) {
    await this.jobCardRepo.update(id, data);
    return this.findOne(id);
  }

  delete(id: string) {
    return this.jobCardRepo.delete(id);
  }
}
