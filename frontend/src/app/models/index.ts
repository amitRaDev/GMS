export enum JobStatus {
  IDLE = 'IDLE',
  ONGOING = 'ONGOING',
  TEST_DRIVE = 'TEST_DRIVE',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export enum ServiceType {
  GENERAL_SERVICE = 'General Service',
  OIL_CHANGE = 'Oil Change',
  BRAKE_SERVICE = 'Brake Service',
  TIRE_ROTATION = 'Tire Rotation',
  ENGINE_REPAIR = 'Engine Repair',
  AC_SERVICE = 'AC Service',
  BODY_WORK = 'Body Work',
  ELECTRICAL = 'Electrical',
  INSPECTION = 'Inspection',
  OTHER = 'Other',
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  createdAt: Date;
}

export interface JobCard {
  id: string;
  jobNumber: string;
  vehicle: Vehicle;
  vehicleId: string;
  status: JobStatus;
  serviceDescription?: string;
  estimatedCost?: number;
  finalCost?: number;
  vehicleEntryTime?: Date;
  vehicleExitTime?: Date;
  testDriveOutTime?: Date;
  testDriveInTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
