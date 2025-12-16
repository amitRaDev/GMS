import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'longtext' })
  data: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicleNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cameraId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  eventType: string;

  @Column({ type: 'timestamp', nullable: true })
  capturedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
