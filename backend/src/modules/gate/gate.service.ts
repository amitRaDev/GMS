import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Vehicle, JobCard, GateLog, GateEventType, GateDirection as LogDirection } from '../../common/entities';
import { JobStatus } from '../../common/enums';
import { GarageGateway } from '../websocket/garage.gateway';
import { GateEventDto, GateDirection } from './dto/gate-event.dto';
import { GateLogService } from '../gate-log/gate-log.service';

export interface GateResponse {
  success: boolean;
  action: string;
  message: string;
  jobCard?: JobCard;
  requiresAction?: boolean;
  vehicleNumber?: string;
  hasJobCard?: boolean;
  canExit?: boolean;
  exitReason?: string;
}

@Injectable()
export class GateService {
  private readonly logger = new Logger(GateService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(JobCard)
    private jobCardRepo: Repository<JobCard>,
    private gateway: GarageGateway,
    private gateLogService: GateLogService,
  ) {}

  /**
   * Main entry point for ANPR camera events
   * Handles the state machine logic for gate IN/OUT events
   */
  async handleGateEvent(dto: GateEventDto, cameraData?: {
    cameraId?: string;
    vehicleType?: string;
    imageId?: string;
    image?: string;
    eventTime?: Date;
  }): Promise<GateResponse> {
    const { vehicleNumber, direction, isTestDrive } = dto;
    const normalizedNumber = vehicleNumber.toUpperCase().replace(/\s/g, '');

    this.logger.log(`Gate Event: ${normalizedNumber} - ${direction} ${isTestDrive ? '(Test Drive)' : ''} ${cameraData?.cameraId ? `[Camera: ${cameraData.cameraId}]` : ''}`);

    // Step 1: Find vehicle by number
    const vehicle = await this.findVehicleByNumber(normalizedNumber);

    // Step 2: Find latest job card for this vehicle
    const latestJob = vehicle ? await this.findLatestJobCard(vehicle.id) : null;

    this.logger.log(`Vehicle: ${vehicle?.id || 'NOT FOUND'}, Latest Job: ${latestJob?.jobNumber || 'NONE'} (${latestJob?.status || 'N/A'})`);

    // Step 3: Route to appropriate handler based on direction
    if (direction === GateDirection.IN) {
      return this.handleGateIn(normalizedNumber, vehicle, latestJob, cameraData);
    } else {
      return this.handleGateOut(normalizedNumber, vehicle, latestJob, isTestDrive, cameraData);
    }
  }

  /**
   * Handle Gate IN events - Always emit popup request
   * Frontend will show popup asking for confirmation
   */
  private async handleGateIn(
    vehicleNumber: string,
    vehicle: Vehicle | null,
    latestJob: JobCard | null,
    cameraData?: { cameraId?: string; vehicleType?: string; imageId?: string; image?: string; eventTime?: Date },
  ): Promise<GateResponse> {
    const hasActiveJob = latestJob && 
      (latestJob.status === JobStatus.IDLE || 
       latestJob.status === JobStatus.ONGOING || 
       latestJob.status === JobStatus.TEST_DRIVE);

    const message = hasActiveJob 
      ? `Vehicle ${vehicleNumber} detected. Job Card: ${latestJob?.jobNumber} (${latestJob?.status})`
      : `Vehicle ${vehicleNumber} detected. No active job card found.`;

    // Log entry request with camera data
    await this.gateLogService.create({
      vehicleNumber,
      eventType: GateEventType.ENTRY_REQUEST,
      direction: LogDirection.IN,
      jobNumber: latestJob?.jobNumber,
      message,
      hasJobCard: !!hasActiveJob,
      vehicleId: vehicle?.id,
      jobCardId: latestJob?.id,
      cameraId: cameraData?.cameraId,
      vehicleType: cameraData?.vehicleType,
      imageId: cameraData?.imageId,
      eventTime: cameraData?.eventTime,
    });

    // Always emit entry request for popup with image
    this.gateway.emitEntryRequest({
      vehicleNumber,
      hasJobCard: !!hasActiveJob,
      jobCardId: latestJob?.id,
      jobNumber: latestJob?.jobNumber,
      jobStatus: latestJob?.status,
      message,
      timestamp: new Date(),
      image: cameraData?.image,
      vehicleType: cameraData?.vehicleType,
      cameraId: cameraData?.cameraId,
    });

    return {
      success: true,
      action: 'ENTRY_REQUEST',
      message: `Entry request sent for ${vehicleNumber}. Awaiting confirmation.`,
      requiresAction: true,
      vehicleNumber,
      hasJobCard: !!hasActiveJob,
      jobCard: latestJob || undefined,
    };
  }


  /**
   * Handle Gate OUT events - Always emit popup request
   * Only allow exit if status is COMPLETED or TEST_DRIVE
   */
  private async handleGateOut(
    vehicleNumber: string,
    vehicle: Vehicle | null,
    latestJob: JobCard | null,
    isTestDrive?: boolean,
    cameraData?: { cameraId?: string; vehicleType?: string; imageId?: string; image?: string; eventTime?: Date },
  ): Promise<GateResponse> {
    // Check if exit is allowed
    const canExit = latestJob && 
      (latestJob.status === JobStatus.COMPLETED || 
       latestJob.status === JobStatus.TEST_DRIVE ||
       (latestJob.status === JobStatus.ONGOING && isTestDrive));

    let exitReason = '';
    if (!latestJob) {
      exitReason = 'No job card found for this vehicle';
    } else if (latestJob.status === JobStatus.IDLE) {
      exitReason = 'Vehicle has not entered yet (status: IDLE)';
    } else if (latestJob.status === JobStatus.ONGOING && !isTestDrive) {
      exitReason = 'Service is still ongoing. Mark as Complete or Test Drive first.';
    } else if (latestJob.status === JobStatus.CLOSED) {
      exitReason = 'Job is already closed';
    } else if (latestJob.status === JobStatus.COMPLETED) {
      exitReason = 'Service completed. Ready for exit.';
    } else if (latestJob.status === JobStatus.TEST_DRIVE) {
      exitReason = 'Vehicle is on test drive. Ready for exit.';
    } else if (isTestDrive) {
      exitReason = 'Test drive requested.';
    }

    const message = canExit 
      ? `Vehicle ${vehicleNumber} requesting exit. ${exitReason}`
      : `Vehicle ${vehicleNumber} cannot exit. ${exitReason}`;

    // Log exit request with camera data
    await this.gateLogService.create({
      vehicleNumber,
      eventType: GateEventType.EXIT_REQUEST,
      direction: LogDirection.OUT,
      jobNumber: latestJob?.jobNumber,
      message,
      hasJobCard: !!latestJob,
      vehicleId: vehicle?.id,
      jobCardId: latestJob?.id,
      cameraId: cameraData?.cameraId,
      vehicleType: cameraData?.vehicleType,
      imageId: cameraData?.imageId,
      eventTime: cameraData?.eventTime,
    });

    // Always emit exit request for popup with image
    this.gateway.emitExitRequest({
      vehicleNumber,
      canExit: !!canExit,
      exitReason,
      jobCardId: latestJob?.id,
      jobNumber: latestJob?.jobNumber,
      jobStatus: latestJob?.status,
      isTestDrive: !!isTestDrive,
      message,
      timestamp: new Date(),
      image: cameraData?.image,
      vehicleType: cameraData?.vehicleType,
      cameraId: cameraData?.cameraId,
    });

    return {
      success: true,
      action: 'EXIT_REQUEST',
      message: `Exit request sent for ${vehicleNumber}. Awaiting confirmation.`,
      requiresAction: true,
      vehicleNumber,
      canExit: !!canExit,
      exitReason,
      jobCard: latestJob || undefined,
    };
  }

  /**
   * Find vehicle by normalized number
   */
  private async findVehicleByNumber(vehicleNumber: string): Promise<Vehicle | null> {
    return this.vehicleRepo.findOne({
      where: { vehicleNumber },
    });
  }

  /**
   * Find the latest job card for a vehicle (most recent by creation date)
   */
  private async findLatestJobCard(vehicleId: string): Promise<JobCard | null> {
    return this.jobCardRepo.findOne({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
      relations: ['vehicle'],
    });
  }

  /**
   * Confirm entry - called when operator approves entry from popup
   */
  async confirmEntry(vehicleNumber: string): Promise<GateResponse> {
    const normalizedNumber = vehicleNumber.toUpperCase().replace(/\s/g, '');
    let vehicle = await this.findVehicleByNumber(normalizedNumber);
    
    // Create vehicle if doesn't exist
    if (!vehicle) {
      vehicle = this.vehicleRepo.create({ vehicleNumber: normalizedNumber });
      await this.vehicleRepo.save(vehicle);
    }

    const latestJob = await this.findLatestJobCard(vehicle.id);

    // If IDLE job exists, start it
    if (latestJob?.status === JobStatus.IDLE) {
      const previousStatus = latestJob.status;
      latestJob.status = JobStatus.ONGOING;
      latestJob.vehicleEntryTime = new Date();
      await this.jobCardRepo.save(latestJob);

      // Log entry allowed
      await this.gateLogService.create({
        vehicleNumber: normalizedNumber,
        eventType: GateEventType.ENTRY_ALLOWED,
        direction: LogDirection.IN,
        jobNumber: latestJob.jobNumber,
        previousStatus,
        newStatus: JobStatus.ONGOING,
        message: `Vehicle ${normalizedNumber} entered. Job ${latestJob.jobNumber} started.`,
        hasJobCard: true,
        actionTaken: true,
        vehicleId: vehicle.id,
        jobCardId: latestJob.id,
      });

      this.gateway.emitEntryLogged({
        vehicleNumber: normalizedNumber,
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        message: `Vehicle ${normalizedNumber} entered. Job ${latestJob.jobNumber} started.`,
      });

      this.gateway.emitJobStatusChanged({
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        vehicleNumber: normalizedNumber,
        previousStatus,
        newStatus: JobStatus.ONGOING,
      });

      return {
        success: true,
        action: 'ENTRY_CONFIRMED',
        message: `Entry confirmed. Job ${latestJob.jobNumber} is now ONGOING.`,
        jobCard: latestJob,
      };
    }

    // If TEST_DRIVE, return from test drive
    if (latestJob?.status === JobStatus.TEST_DRIVE) {
      const previousStatus = latestJob.status;
      latestJob.status = JobStatus.ONGOING;
      latestJob.testDriveInTime = new Date();
      await this.jobCardRepo.save(latestJob);

      // Log test drive return
      await this.gateLogService.create({
        vehicleNumber: normalizedNumber,
        eventType: GateEventType.TEST_DRIVE_RETURN,
        direction: LogDirection.IN,
        jobNumber: latestJob.jobNumber,
        previousStatus,
        newStatus: JobStatus.ONGOING,
        message: `Vehicle ${normalizedNumber} returned from test drive.`,
        hasJobCard: true,
        actionTaken: true,
        vehicleId: vehicle.id,
        jobCardId: latestJob.id,
      });

      this.gateway.emitTestDriveReturn({
        vehicleNumber: normalizedNumber,
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        message: `Vehicle ${normalizedNumber} returned from test drive.`,
      });

      this.gateway.emitJobStatusChanged({
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        vehicleNumber: normalizedNumber,
        previousStatus,
        newStatus: JobStatus.ONGOING,
      });

      return {
        success: true,
        action: 'TEST_DRIVE_RETURN',
        message: `Test drive return confirmed. Job continues as ONGOING.`,
        jobCard: latestJob,
      };
    }

    // No active job - entry allowed but needs job card creation
    await this.gateLogService.create({
      vehicleNumber: normalizedNumber,
      eventType: GateEventType.ENTRY_ALLOWED,
      direction: LogDirection.IN,
      message: `Entry allowed for ${normalizedNumber}. No active job card.`,
      hasJobCard: false,
      actionTaken: true,
      vehicleId: vehicle.id,
    });

    return {
      success: true,
      action: 'ENTRY_ALLOWED_NO_JOB',
      message: `Entry allowed for ${normalizedNumber}. No active job card - create one.`,
      vehicleNumber: normalizedNumber,
      hasJobCard: false,
    };
  }

  /**
   * Confirm exit - called when operator approves exit from popup
   */
  async confirmExit(vehicleNumber: string, isTestDrive: boolean = false): Promise<GateResponse> {
    const normalizedNumber = vehicleNumber.toUpperCase().replace(/\s/g, '');
    const vehicle = await this.findVehicleByNumber(normalizedNumber);
    
    if (!vehicle) {
      return { success: false, action: 'NOT_FOUND', message: 'Vehicle not found.' };
    }

    const latestJob = await this.findLatestJobCard(vehicle.id);

    if (!latestJob) {
      return { success: false, action: 'NO_JOB', message: 'No job card found.' };
    }

    // Test drive out
    if (latestJob.status === JobStatus.ONGOING && isTestDrive) {
      const previousStatus = latestJob.status;
      latestJob.status = JobStatus.TEST_DRIVE;
      latestJob.testDriveOutTime = new Date();
      await this.jobCardRepo.save(latestJob);

      // Log test drive out
      await this.gateLogService.create({
        vehicleNumber: normalizedNumber,
        eventType: GateEventType.TEST_DRIVE_OUT,
        direction: LogDirection.OUT,
        jobNumber: latestJob.jobNumber,
        previousStatus,
        newStatus: JobStatus.TEST_DRIVE,
        message: `Vehicle ${normalizedNumber} out for test drive.`,
        hasJobCard: true,
        actionTaken: true,
        vehicleId: vehicle.id,
        jobCardId: latestJob.id,
      });

      this.gateway.emitTestDriveOut({
        vehicleNumber: normalizedNumber,
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        message: `Vehicle ${normalizedNumber} out for test drive.`,
      });

      this.gateway.emitJobStatusChanged({
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        vehicleNumber: normalizedNumber,
        previousStatus,
        newStatus: JobStatus.TEST_DRIVE,
      });

      return {
        success: true,
        action: 'TEST_DRIVE_OUT',
        message: `Test drive started for ${normalizedNumber}.`,
        jobCard: latestJob,
      };
    }

    // Completed - close job
    if (latestJob.status === JobStatus.COMPLETED) {
      const previousStatus = latestJob.status;
      latestJob.status = JobStatus.CLOSED;
      latestJob.vehicleExitTime = new Date();
      await this.jobCardRepo.save(latestJob);

      // Log exit allowed and job closed
      await this.gateLogService.create({
        vehicleNumber: normalizedNumber,
        eventType: GateEventType.EXIT_ALLOWED,
        direction: LogDirection.OUT,
        jobNumber: latestJob.jobNumber,
        previousStatus,
        newStatus: JobStatus.CLOSED,
        message: `Vehicle ${normalizedNumber} exited. Job closed.`,
        hasJobCard: true,
        actionTaken: true,
        vehicleId: vehicle.id,
        jobCardId: latestJob.id,
      });

      this.gateway.emitJobClosed({
        vehicleNumber: normalizedNumber,
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        message: `Vehicle ${normalizedNumber} exited. Job closed.`,
      });

      this.gateway.emitJobStatusChanged({
        jobCardId: latestJob.id,
        jobNumber: latestJob.jobNumber,
        vehicleNumber: normalizedNumber,
        previousStatus,
        newStatus: JobStatus.CLOSED,
      });

      return {
        success: true,
        action: 'EXIT_CONFIRMED',
        message: `Exit confirmed. Job ${latestJob.jobNumber} closed.`,
        jobCard: latestJob,
      };
    }

    // Already on test drive - allow exit
    if (latestJob.status === JobStatus.TEST_DRIVE) {
      await this.gateLogService.create({
        vehicleNumber: normalizedNumber,
        eventType: GateEventType.EXIT_ALLOWED,
        direction: LogDirection.OUT,
        jobNumber: latestJob.jobNumber,
        message: `Exit confirmed for test drive vehicle ${normalizedNumber}.`,
        hasJobCard: true,
        actionTaken: true,
        vehicleId: vehicle.id,
        jobCardId: latestJob.id,
      });

      return {
        success: true,
        action: 'EXIT_CONFIRMED',
        message: `Exit confirmed for test drive vehicle ${normalizedNumber}.`,
        jobCard: latestJob,
      };
    }

    // Log exit denied
    await this.gateLogService.create({
      vehicleNumber: normalizedNumber,
      eventType: GateEventType.EXIT_DENIED,
      direction: LogDirection.OUT,
      jobNumber: latestJob.jobNumber,
      message: `Cannot exit. Current status: ${latestJob.status}`,
      hasJobCard: true,
      actionTaken: false,
      vehicleId: vehicle.id,
      jobCardId: latestJob.id,
    });

    return {
      success: false,
      action: 'CANNOT_EXIT',
      message: `Cannot exit. Current status: ${latestJob.status}`,
    };
  }

  /**
   * Force close a job (called from dashboard when confirming vehicle leaving alert)
   */
  async forceCloseJob(jobCardId: string): Promise<GateResponse> {
    const jobCard = await this.jobCardRepo.findOne({
      where: { id: jobCardId },
      relations: ['vehicle'],
    });

    if (!jobCard) {
      return { success: false, action: 'NOT_FOUND', message: 'Job card not found.' };
    }

    const previousStatus = jobCard.status;
    jobCard.status = JobStatus.CLOSED;
    jobCard.vehicleExitTime = new Date();
    await this.jobCardRepo.save(jobCard);

    this.gateway.emitJobClosed({
      vehicleNumber: jobCard.vehicle.vehicleNumber,
      jobCardId: jobCard.id,
      jobNumber: jobCard.jobNumber,
      message: `Job ${jobCard.jobNumber} force closed.`,
    });

    this.gateway.emitJobStatusChanged({
      jobCardId: jobCard.id,
      jobNumber: jobCard.jobNumber,
      vehicleNumber: jobCard.vehicle.vehicleNumber,
      previousStatus,
      newStatus: JobStatus.CLOSED,
    });

    return {
      success: true,
      action: 'FORCE_CLOSED',
      message: `Job ${jobCard.jobNumber} has been closed.`,
      jobCard,
    };
  }
}
