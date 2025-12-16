import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export enum SocketEvents {
  ENTRY_REQUEST = 'ENTRY_REQUEST',
  EXIT_REQUEST = 'EXIT_REQUEST',
  ENTRY_LOGGED = 'ENTRY_LOGGED',
  UNKNOWN_ENTRY_DETECTED = 'UNKNOWN_ENTRY_DETECTED',
  VEHICLE_LEAVING_ALERT = 'VEHICLE_LEAVING_ALERT',
  TEST_DRIVE_OUT = 'TEST_DRIVE_OUT',
  TEST_DRIVE_RETURN = 'TEST_DRIVE_RETURN',
  JOB_STATUS_CHANGED = 'JOB_STATUS_CHANGED',
  JOB_CLOSED = 'JOB_CLOSED',
}

@WebSocketGateway({
  cors: { origin: ['http://localhost:4200'], credentials: true },
})
export class GarageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  // Entry request - always show popup
  emitEntryRequest(data: {
    vehicleNumber: string;
    hasJobCard: boolean;
    jobCardId?: string;
    jobNumber?: string;
    jobStatus?: string;
    message: string;
    timestamp: Date;
  }) {
    console.log(`🚗 ${SocketEvents.ENTRY_REQUEST}:`, data.vehicleNumber, data.hasJobCard ? `(Job: ${data.jobNumber})` : '(No Job)');
    this.server.emit(SocketEvents.ENTRY_REQUEST, data);
  }

  // Exit request - always show popup
  emitExitRequest(data: {
    vehicleNumber: string;
    canExit: boolean;
    exitReason: string;
    jobCardId?: string;
    jobNumber?: string;
    jobStatus?: string;
    isTestDrive: boolean;
    message: string;
    timestamp: Date;
  }) {
    console.log(`🚙 ${SocketEvents.EXIT_REQUEST}:`, data.vehicleNumber, data.canExit ? '(Can Exit)' : '(Cannot Exit)');
    this.server.emit(SocketEvents.EXIT_REQUEST, data);
  }

  // IDLE + IN → ONGOING: Entry logged
  emitEntryLogged(data: {
    vehicleNumber: string;
    jobCardId: string;
    jobNumber: string;
    message: string;
  }) {
    console.log(`📢 ${SocketEvents.ENTRY_LOGGED}:`, data.vehicleNumber);
    this.server.emit(SocketEvents.ENTRY_LOGGED, data);
  }

  // NULL + IN: Unknown vehicle detected
  emitUnknownEntryDetected(data: {
    vehicleNumber: string;
    timestamp: Date;
    message: string;
  }) {
    console.log(`🚨 ${SocketEvents.UNKNOWN_ENTRY_DETECTED}:`, data.vehicleNumber);
    this.server.emit(SocketEvents.UNKNOWN_ENTRY_DETECTED, data);
  }

  // ONGOING + OUT (not test drive): Alert to close job
  emitVehicleLeavingAlert(data: {
    vehicleNumber: string;
    jobCardId: string;
    jobNumber: string;
    message: string;
  }) {
    console.log(`⚠️ ${SocketEvents.VEHICLE_LEAVING_ALERT}:`, data.vehicleNumber);
    this.server.emit(SocketEvents.VEHICLE_LEAVING_ALERT, data);
  }

  // ONGOING + OUT (test drive): Test drive started
  emitTestDriveOut(data: {
    vehicleNumber: string;
    jobCardId: string;
    jobNumber: string;
    message: string;
  }) {
    console.log(`🏎️ ${SocketEvents.TEST_DRIVE_OUT}:`, data.vehicleNumber);
    this.server.emit(SocketEvents.TEST_DRIVE_OUT, data);
  }

  // TEST_DRIVE + IN: Test drive return
  emitTestDriveReturn(data: {
    vehicleNumber: string;
    jobCardId: string;
    jobNumber: string;
    message: string;
  }) {
    console.log(`🔙 ${SocketEvents.TEST_DRIVE_RETURN}:`, data.vehicleNumber);
    this.server.emit(SocketEvents.TEST_DRIVE_RETURN, data);
  }

  // Generic status change
  emitJobStatusChanged(data: {
    jobCardId: string;
    jobNumber: string;
    vehicleNumber: string;
    previousStatus: string;
    newStatus: string;
  }) {
    console.log(`🔄 ${SocketEvents.JOB_STATUS_CHANGED}:`, data.jobNumber, data.newStatus);
    this.server.emit(SocketEvents.JOB_STATUS_CHANGED, data);
  }

  // Job closed on exit
  emitJobClosed(data: {
    vehicleNumber: string;
    jobCardId: string;
    jobNumber: string;
    message: string;
  }) {
    console.log(`✅ ${SocketEvents.JOB_CLOSED}:`, data.jobNumber);
    this.server.emit(SocketEvents.JOB_CLOSED, data);
  }
}
