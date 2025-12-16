import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { JobCard, JobStatus, ServiceType } from '../../models';

@Component({
  selector: 'app-job-card-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-card-list.component.html',
})
export class JobCardListComponent implements OnInit {
  private api = inject(ApiService);
  private socketService = inject(SocketService);

  JobStatus = JobStatus;
  statuses = Object.values(JobStatus);
  serviceTypes = Object.values(ServiceType);

  jobs = signal<JobCard[]>([]);
  filteredJobs = signal<JobCard[]>([]);
  filterStatus: JobStatus | null = null;
  showModal = false;
  newJob = { vehicleNumber: '', serviceType: ServiceType.GENERAL_SERVICE, serviceDescription: '' };

  constructor() {
    effect(() => {
      if (this.socketService.latestEvent()) this.loadJobs();
    });
  }

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.api.getJobCards().subscribe((data) => {
      this.jobs.set(data);
      this.applyFilter();
    });
  }

  applyFilter() {
    this.filteredJobs.set(this.filterStatus ? this.jobs().filter((j) => j.status === this.filterStatus) : this.jobs());
  }

  getStatusCount(status: JobStatus): number {
    return this.jobs().filter((j) => j.status === status).length;
  }

  createJob() {
    if (!this.newJob.vehicleNumber) return;
    const desc = this.newJob.serviceType + (this.newJob.serviceDescription ? ' - ' + this.newJob.serviceDescription : '');
    this.api.createJobCard({ vehicleNumber: this.newJob.vehicleNumber, serviceDescription: desc }).subscribe(() => {
      this.showModal = false;
      this.newJob = { vehicleNumber: '', serviceType: ServiceType.GENERAL_SERVICE, serviceDescription: '' };
      this.loadJobs();
    });
  }

  updateStatus(id: string, status: JobStatus) {
    this.api.updateJobStatus(id, status).subscribe(() => this.loadJobs());
  }

  getStatusBadge(status: string): string {
    return { IDLE: 'bg-yellow-100 text-yellow-800', ONGOING: 'bg-green-100 text-green-800', TEST_DRIVE: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-purple-100 text-purple-800', CLOSED: 'bg-gray-100 text-gray-600' }[status] || '';
  }

  getStatusDot(status: string): string {
    return { IDLE: 'bg-yellow-500', ONGOING: 'bg-green-500', TEST_DRIVE: 'bg-blue-500', COMPLETED: 'bg-purple-500', CLOSED: 'bg-gray-400' }[status] || '';
  }
}
