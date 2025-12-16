import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { JobStatus } from '../enums/job-status.enum';

@Entity('job_cards')
export class JobCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  jobNumber: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.jobCards, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column()
  vehicleId: string;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.IDLE })
  status: JobStatus;

  @Column({ type: 'text', nullable: true })
  serviceDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalCost: number;

  @Column({ type: 'datetime', nullable: true })
  vehicleEntryTime: Date;

  @Column({ type: 'datetime', nullable: true })
  vehicleExitTime: Date;

  @Column({ type: 'datetime', nullable: true })
  testDriveOutTime: Date;

  @Column({ type: 'datetime', nullable: true })
  testDriveInTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
