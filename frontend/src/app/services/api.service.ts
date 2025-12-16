import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JobCard, Vehicle, JobStatus } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Job Cards
  getJobCards() {
    return this.http.get<JobCard[]>(`${this.baseUrl}/job-cards`);
  }

  getActiveJobCards() {
    return this.http.get<JobCard[]>(`${this.baseUrl}/job-cards/active`);
  }

  createJobCard(data: { 
    vehicleNumber: string; 
    serviceDescription?: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    make?: string;
    model?: string;
    color?: string;
  }) {
    return this.http.post<JobCard>(`${this.baseUrl}/job-cards`, data);
  }

  updateJobStatus(id: string, status: JobStatus) {
    return this.http.patch<JobCard>(`${this.baseUrl}/job-cards/${id}/status`, { status });
  }

  // Vehicles
  getVehicles() {
    return this.http.get<Vehicle[]>(`${this.baseUrl}/vehicles`);
  }

  searchVehicle(number: string) {
    return this.http.get<Vehicle>(`${this.baseUrl}/vehicles/search?number=${number}`);
  }

  createVehicle(data: Partial<Vehicle>) {
    return this.http.post<Vehicle>(`${this.baseUrl}/vehicles`, data);
  }

  // Gate API - ANPR Camera simulation
  sendGateEvent(vehicleNumber: string, direction: 'IN' | 'OUT', isTestDrive = false) {
    return this.http.post(`${this.baseUrl}/gate/event`, {
      vehicleNumber,
      direction,
      isTestDrive,
    });
  }

  // Confirm entry - operator approves vehicle entry
  confirmEntry(vehicleNumber: string) {
    return this.http.post(`${this.baseUrl}/gate/confirm-entry`, { vehicleNumber });
  }

  // Confirm exit - operator approves vehicle exit
  confirmExit(vehicleNumber: string, isTestDrive = false) {
    return this.http.post(`${this.baseUrl}/gate/confirm-exit`, { vehicleNumber, isTestDrive });
  }

  // Force close job (when operator confirms vehicle leaving alert)
  forceCloseJob(jobCardId: string) {
    return this.http.post(`${this.baseUrl}/gate/force-close/${jobCardId}`, {});
  }

  // Gate Logs / History
  getGateLogs(page = 1, limit = 20, vehicleNumber?: string, eventType?: string) {
    let url = `${this.baseUrl}/gate-logs?page=${page}&limit=${limit}`;
    if (vehicleNumber) url += `&vehicleNumber=${vehicleNumber}`;
    if (eventType) url += `&eventType=${eventType}`;
    return this.http.get<{
      data: GateLog[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(url);
  }

  getGateLogStats() {
    return this.http.get<{
      totalEntries: number;
      totalExits: number;
      todayEntries: number;
      todayExits: number;
    }>(`${this.baseUrl}/gate-logs/stats`);
  }

  // Cameras
  getCameras() {
    return this.http.get<Camera[]>(`${this.baseUrl}/camera`);
  }

  getCamera(id: string) {
    return this.http.get<Camera>(`${this.baseUrl}/camera/${id}`);
  }

  createCamera(data: CreateCameraDto) {
    return this.http.post<Camera>(`${this.baseUrl}/camera`, data);
  }

  updateCamera(id: string, data: Partial<Camera>) {
    return this.http.put<Camera>(`${this.baseUrl}/camera/${id}`, data);
  }

  deleteCamera(id: string) {
    return this.http.delete(`${this.baseUrl}/camera/${id}`);
  }

  regenerateCameraToken(id: string) {
    return this.http.post<Camera>(`${this.baseUrl}/camera/${id}/regenerate-token`, {});
  }
}

export interface GateLog {
  id: string;
  vehicleNumber: string;
  eventType: string;
  direction: string;
  jobNumber?: string;
  previousStatus?: string;
  newStatus?: string;
  message?: string;
  hasJobCard: boolean;
  actionTaken: boolean;
  cameraId?: string;
  vehicleType?: string;
  image?: string;
  createdAt: string;
}

export interface Camera {
  id: string;
  cameraId: string;
  name: string;
  location?: string;
  gateType: 'IN' | 'OUT' | 'BOTH';
  isActive: boolean;
  apiToken?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCameraDto {
  cameraId: string;
  name: string;
  location?: string;
  gateType?: 'IN' | 'OUT' | 'BOTH';
  description?: string;
}
