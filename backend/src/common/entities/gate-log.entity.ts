import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { JobCard } from './job-card.entity';

export enum GateEventType {
  ENTRY_REQUEST = 'ENTRY_REQUEST',
  ENTRY_ALLOWED = 'ENTRY_ALLOWED',
  ENTRY_DENIED = 'ENTRY_DENIED',
  EXIT_REQUEST = 'EXIT_REQUEST',
  EXIT_ALLOWED = 'EXIT_ALLOWED',
  EXIT_DENIED = 'EXIT_DENIED',
  TEST_DRIVE_OUT = 'TEST_DRIVE_OUT',
  TEST_DRIVE_RETURN = 'TEST_DRIVE_RETURN',
  JOB_CREATED = 'JOB_CREATED',
  JOB_STATUS_CHANGED = 'JOB_STATUS_CHANGED',
  JOB_CLOSED = 'JOB_CLOSED',
}

export enum GateDirection {
  IN = 'IN',
  OUT = 'OUT',
}

@Entity('gate_logs')
export class GateLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  vehicleNumber: string;

  @Column({ type: 'enum', enum: GateEventType })
  eventType: GateEventType;

  @Column({ type: 'enum', enum: GateDirection, nullable: true })
  direction: GateDirection;

  @Column({ type: 'varchar', length: 50, nullable: true })
  jobNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  previousStatus: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  newStatus: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'boolean', default: false })
  hasJobCard: boolean;

  @Column({ type: 'boolean', default: false })
  actionTaken: boolean;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => JobCard, { nullable: true })
  @JoinColumn({ name: 'jobCardId' })
  jobCard: JobCard;

  @Column({ nullable: true })
  jobCardId: string;

  @CreateDateColumn()
  createdAt: Date;
}
