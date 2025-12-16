import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { EventStorageService } from './event-storage.service';
import { environment } from '../../environments/environment';

export interface EntryRequest {
  vehicleNumber: string;
  hasJobCard: boolean;
  jobCardId?: string;
  jobNumber?: string;
  jobStatus?: string;
  message: string;
  timestamp: Date;
}

export interface ExitRequest {
  vehicleNumber: string;
  canExit: boolean;
  exitReason: string;
  jobCardId?: string;
  jobNumber?: string;
  jobStatus?: string;
  isTestDrive: boolean;
  message: string;
  timestamp: Date;
}

export interface GateAlert {
  type: 'UNKNOWN_ENTRY' | 'VEHICLE_LEAVING' | 'ENTRY_REQUEST' | 'EXIT_REQUEST';
  vehicleNumber: string;
  jobCardId?: string;
  jobNumber?: string;
  message: string;
  timestamp: Date;
}

export interface GateEvent {
  id?: number;
  type: string;
  vehicleNumber: string;
  jobCardId?: string;
  jobNumber?: string;
  message: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private storage = inject(EventStorageService);

  alerts = signal<GateAlert[]>([]);
  events = signal<GateEvent[]>([]);
  latestEvent = signal<GateEvent | null>(null);
  connected = signal(false);
  eventCount = signal(0);

  entryRequest = signal<EntryRequest | null>(null);
  exitRequest = signal<ExitRequest | null>(null);

  constructor() {
    this.loadStoredEvents();
    this.connect();
  }

  private async loadStoredEvents() {
    const storedEvents = await this.storage.getEvents(50);
    this.events.set(storedEvents);
    const count = await this.storage.getEventCount();
    this.eventCount.set(count);
  }

  private connect() {
    this.socket = io(environment.wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.connected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.connected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.log('Socket connection error:', error.message);
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('ENTRY_REQUEST', (data) => {
      console.log('📥 Entry request:', data);
      this.entryRequest.set({ ...data, timestamp: new Date(data.timestamp) });
      this.addEvent({ type: 'ENTRY_REQUEST', ...data, timestamp: new Date() });
    });

    this.socket.on('EXIT_REQUEST', (data) => {
      console.log('📤 Exit request:', data);
      this.exitRequest.set({ ...data, timestamp: new Date(data.timestamp) });
      this.addEvent({ type: 'EXIT_REQUEST', ...data, timestamp: new Date() });
    });

    this.socket.on('ENTRY_LOGGED', (data) => {
      this.addEvent({ type: 'ENTRY_LOGGED', ...data, timestamp: new Date() });
    });

    this.socket.on('UNKNOWN_ENTRY_DETECTED', (data) => {
      this.addEvent({ type: 'UNKNOWN_ENTRY_DETECTED', ...data, timestamp: new Date() });
    });

    this.socket.on('VEHICLE_LEAVING_ALERT', (data) => {
      this.addEvent({ type: 'VEHICLE_LEAVING_ALERT', ...data, timestamp: new Date() });
    });

    this.socket.on('TEST_DRIVE_OUT', (data) => {
      this.addEvent({ type: 'TEST_DRIVE_OUT', ...data, timestamp: new Date() });
    });

    this.socket.on('TEST_DRIVE_RETURN', (data) => {
      this.addEvent({ type: 'TEST_DRIVE_RETURN', ...data, timestamp: new Date() });
    });

    this.socket.on('JOB_STATUS_CHANGED', (data) => {
      this.addEvent({
        type: 'JOB_STATUS_CHANGED',
        vehicleNumber: data.vehicleNumber,
        jobCardId: data.jobCardId,
        jobNumber: data.jobNumber,
        message: `${data.jobNumber}: ${data.previousStatus} → ${data.newStatus}`,
        timestamp: new Date(),
      });
    });

    this.socket.on('JOB_CLOSED', (data) => {
      this.addEvent({ type: 'JOB_CLOSED', ...data, timestamp: new Date() });
    });
  }

  private async addEvent(event: GateEvent) {
    this.latestEvent.set(event);
    // Update UI immediately
    this.events.update((events) => [event, ...events].slice(0, 50));
    // Persist to IndexedDB
    await this.storage.addEvent(event);
    const count = await this.storage.getEventCount();
    this.eventCount.set(count);
  }

  clearEntryRequest() {
    this.entryRequest.set(null);
  }

  clearExitRequest() {
    this.exitRequest.set(null);
  }

  dismissAlert(vehicleNumber: string) {
    this.alerts.update((alerts) => alerts.filter((a) => a.vehicleNumber !== vehicleNumber));
  }

  dismissAlertByJob(jobCardId: string) {
    this.alerts.update((alerts) => alerts.filter((a) => a.jobCardId !== jobCardId));
  }

  async clearAllEvents() {
    await this.storage.clearEvents();
    this.events.set([]);
    this.eventCount.set(0);
  }
}
