import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { JobCard } from './job-card.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  vehicleNumber: string;

  @Column({ length: 50, nullable: true })
  make: string;

  @Column({ length: 50, nullable: true })
  model: string;

  @Column({ nullable: true })
  year: number;

  @Column({ length: 30, nullable: true })
  color: string;

  @Column({ length: 100, nullable: true })
  ownerName: string;

  @Column({ length: 15, nullable: true })
  ownerPhone: string;

  @Column({ length: 100, nullable: true })
  ownerEmail: string;

  @OneToMany(() => JobCard, (jobCard) => jobCard.vehicle)
  jobCards: JobCard[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
