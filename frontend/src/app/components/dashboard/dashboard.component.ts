import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { JobCard, JobStatus, ServiceType } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  socketService = inject(SocketService);

  JobStatus = JobStatus;
  serviceTypes = Object.values(ServiceType);

  jobCards = signal<JobCard[]>([]);
  showCreateModal = false;
  showSimulator = false;
  showCreateJobAfterEntry = false;
  pendingVehicleNumber = '';
  simVehicle = '';
  simResult: any = null;

  createForm = { vehicleNumber: '', serviceType: ServiceType.GENERAL_SERVICE, serviceDescription: '' };

  stats = signal([
    { label: 'Waiting', count: 0, color: 'text-yellow-600', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'In Service', count: 0, color: 'text-green-600', bgColor: 'bg-green-100', iconColor: 'text-green-600', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { label: 'Test Drive', count: 0, color: 'text-blue-600', bgColor: 'bg-blue-100', iconColor: 'text-blue-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Completed', count: 0, color: 'text-purple-600', bgColor: 'bg-purple-100', iconColor: 'text-purple-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]);

  constructor() {
    effect(() => {
      const event = this.socketService.latestEvent();
      if (event) this.loadJobCards();
    });
  }

  ngOnInit() { this.loadJobCards(); }

  loadJobCards() {
    this.api.getActiveJobCards().subscribe((jobs) => {
      this.jobCards.set(jobs);
      this.updateStats(jobs);
    });
  }


  updateStats(jobs: JobCard[]) {
    this.stats.update((s) => [
      { ...s[0], count: jobs.filter((j) => j.status === 'IDLE').length },
      { ...s[1], count: jobs.filter((j) => j.status === 'ONGOING').length },
      { ...s[2], count: jobs.filter((j) => j.status === 'TEST_DRIVE').length },
      { ...s[3], count: jobs.filter((j) => j.status === 'COMPLETED').length },
    ]);
  }

  allowEntry() {
    const req = this.socketService.entryRequest();
    if (!req) return;
    this.api.confirmEntry(req.vehicleNumber).subscribe((res: any) => {
      this.socketService.clearEntryRequest();
      this.loadJobCards();
      if (res.action === 'ENTRY_ALLOWED_NO_JOB' || !req.hasJobCard) {
        this.pendingVehicleNumber = req.vehicleNumber;
        this.showCreateJobAfterEntry = true;
      }
    });
  }

  denyEntry() { this.socketService.clearEntryRequest(); }

  allowExit() {
    const req = this.socketService.exitRequest();
    if (!req) return;
    this.api.confirmExit(req.vehicleNumber, req.isTestDrive).subscribe(() => {
      this.socketService.clearExitRequest();
      this.loadJobCards();
    });
  }

  denyExit() { this.socketService.clearExitRequest(); }

  createJobAfterEntry() {
    if (!this.pendingVehicleNumber) return;
    const desc = this.createForm.serviceType + (this.createForm.serviceDescription ? ' - ' + this.createForm.serviceDescription : '');
    this.api.createJobCard({ vehicleNumber: this.pendingVehicleNumber, serviceDescription: desc }).subscribe(() => {
      this.showCreateJobAfterEntry = false;
      this.pendingVehicleNumber = '';
      this.createForm = { vehicleNumber: '', serviceType: ServiceType.GENERAL_SERVICE, serviceDescription: '' };
      this.loadJobCards();
    });
  }

  skipJobCreation() {
    this.showCreateJobAfterEntry = false;
    this.pendingVehicleNumber = '';
  }

  submitCreateJob() {
    if (!this.createForm.vehicleNumber) return;
    const desc = this.createForm.serviceType + (this.createForm.serviceDescription ? ' - ' + this.createForm.serviceDescription : '');
    this.api.createJobCard({ vehicleNumber: this.createForm.vehicleNumber, serviceDescription: desc }).subscribe(() => {
      this.showCreateModal = false;
      this.createForm = { vehicleNumber: '', serviceType: ServiceType.GENERAL_SERVICE, serviceDescription: '' };
      this.loadJobCards();
    });
  }

  updateStatus(id: string, status: JobStatus) {
    this.api.updateJobStatus(id, status).subscribe(() => this.loadJobCards());
  }

  simulateGate(direction: 'IN' | 'OUT', isTestDrive: boolean) {
    if (!this.simVehicle) return;
    this.api.sendGateEvent(this.simVehicle, direction, isTestDrive).subscribe({
      next: (res: any) => (this.simResult = res),
      error: (err) => (this.simResult = { success: false, action: 'ERROR', message: err.error?.message || 'Error' }),
    });
  }

  getStatusClass(status: string) {
    return { IDLE: 'bg-yellow-100 text-yellow-800', ONGOING: 'bg-green-100 text-green-800', TEST_DRIVE: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-purple-100 text-purple-800', CLOSED: 'bg-gray-100 text-gray-800' }[status] || '';
  }

  getStatusBorder(status: string) {
    return { IDLE: 'border-yellow-500', ONGOING: 'border-green-500', TEST_DRIVE: 'border-blue-500', COMPLETED: 'border-purple-500', CLOSED: 'border-gray-500' }[status] || '';
  }

  clearEvents() {
    this.socketService.clearAllEvents();
  }

  getEventBgClass(type: string) {
    const classes: Record<string, string> = {
      ENTRY_REQUEST: 'bg-green-100 dark:bg-green-900/50',
      EXIT_REQUEST: 'bg-blue-100 dark:bg-blue-900/50',
      ENTRY_LOGGED: 'bg-green-100 dark:bg-green-900/50',
      UNKNOWN_ENTRY_DETECTED: 'bg-amber-100 dark:bg-amber-900/50',
      VEHICLE_LEAVING_ALERT: 'bg-red-100 dark:bg-red-900/50',
      TEST_DRIVE_OUT: 'bg-blue-100 dark:bg-blue-900/50',
      TEST_DRIVE_RETURN: 'bg-indigo-100 dark:bg-indigo-900/50',
      JOB_STATUS_CHANGED: 'bg-purple-100 dark:bg-purple-900/50',
      JOB_CLOSED: 'bg-gray-100 dark:bg-gray-700',
    };
    return classes[type] || 'bg-gray-100 dark:bg-gray-700';
  }

  getEventIconColor(type: string) {
    const colors: Record<string, string> = {
      ENTRY_REQUEST: 'text-green-600 dark:text-green-400',
      EXIT_REQUEST: 'text-blue-600 dark:text-blue-400',
      ENTRY_LOGGED: 'text-green-600 dark:text-green-400',
      UNKNOWN_ENTRY_DETECTED: 'text-amber-600 dark:text-amber-400',
      VEHICLE_LEAVING_ALERT: 'text-red-600 dark:text-red-400',
      TEST_DRIVE_OUT: 'text-blue-600 dark:text-blue-400',
      TEST_DRIVE_RETURN: 'text-indigo-600 dark:text-indigo-400',
      JOB_STATUS_CHANGED: 'text-purple-600 dark:text-purple-400',
      JOB_CLOSED: 'text-gray-600 dark:text-gray-400',
    };
    return colors[type] || 'text-gray-600 dark:text-gray-400';
  }

  getEventTagClass(type: string) {
    const classes: Record<string, string> = {
      ENTRY_REQUEST: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      EXIT_REQUEST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      ENTRY_LOGGED: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      UNKNOWN_ENTRY_DETECTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      VEHICLE_LEAVING_ALERT: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      TEST_DRIVE_OUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      TEST_DRIVE_RETURN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
      JOB_STATUS_CHANGED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
      JOB_CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return classes[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }

  formatEventType(type: string) {
    const labels: Record<string, string> = {
      ENTRY_REQUEST: 'Entry',
      EXIT_REQUEST: 'Exit',
      ENTRY_LOGGED: 'Entered',
      UNKNOWN_ENTRY_DETECTED: 'Unknown',
      VEHICLE_LEAVING_ALERT: 'Alert',
      TEST_DRIVE_OUT: 'Test Drive',
      TEST_DRIVE_RETURN: 'Returned',
      JOB_STATUS_CHANGED: 'Status',
      JOB_CLOSED: 'Closed',
    };
    return labels[type] || type;
  }

  getEventIconPath(type: string) {
    const paths: Record<string, string> = {
      ENTRY_REQUEST: 'M11 16l-4-4m0 0l4-4m-4 4h14',
      EXIT_REQUEST: 'M17 16l4-4m0 0l-4-4m4 4H7',
      ENTRY_LOGGED: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      UNKNOWN_ENTRY_DETECTED: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      VEHICLE_LEAVING_ALERT: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      TEST_DRIVE_OUT: 'M13 10V3L4 14h7v7l9-11h-7z',
      TEST_DRIVE_RETURN: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
      JOB_STATUS_CHANGED: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      JOB_CLOSED: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return paths[type] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
}
