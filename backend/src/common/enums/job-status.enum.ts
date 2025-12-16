export enum JobStatus {
  IDLE = 'IDLE',               // Pre-booked/Waiting for vehicle arrival
  ONGOING = 'ONGOING',         // Vehicle in service
  TEST_DRIVE = 'TEST_DRIVE',   // Vehicle out for test drive
  COMPLETED = 'COMPLETED',     // Service complete, awaiting pickup
  CLOSED = 'CLOSED',           // Job fully closed
}
