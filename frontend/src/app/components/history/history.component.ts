import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, GateLog } from '../../services/api.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  private api = inject(ApiService);
  Math = Math;

  logs = signal<GateLog[]>([]);
  stats = signal({ totalEntries: 0, totalExits: 0, todayEntries: 0, todayExits: 0 });
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  pageSize = 20;

  searchVehicle = '';
  filterEventType = '';
  
  // Image preview
  selectedImage: string | null = null;
  selectedVehicle = '';
  
  // Log detail modal
  selectedLog: GateLog | null = null;

  eventTypes = [
    'ENTRY_REQUEST', 'ENTRY_ALLOWED', 'ENTRY_DENIED',
    'EXIT_REQUEST', 'EXIT_ALLOWED', 'EXIT_DENIED',
    'TEST_DRIVE_OUT', 'TEST_DRIVE_RETURN',
    'JOB_CREATED', 'JOB_STATUS_CHANGED', 'JOB_CLOSED',
  ];

  ngOnInit() {
    this.loadLogs();
    this.loadStats();
  }

  loadLogs() {
    this.api.getGateLogs(
      this.currentPage(),
      this.pageSize,
      this.searchVehicle || undefined,
      this.filterEventType || undefined
    ).subscribe((res) => {
      this.logs.set(res.data);
      this.total.set(res.total);
      this.totalPages.set(res.totalPages);
    });
  }

  loadStats() {
    this.api.getGateLogStats().subscribe((stats) => {
      this.stats.set(stats);
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters() {
    this.searchVehicle = '';
    this.filterEventType = '';
    this.currentPage.set(1);
    this.loadLogs();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLogs();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(total, 5);
      else start = Math.max(1, total - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  formatEventType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  getEventClass(type: string): string {
    const classes: Record<string, string> = {
      ENTRY_REQUEST: 'bg-yellow-100 text-yellow-800',
      ENTRY_ALLOWED: 'bg-green-100 text-green-800',
      ENTRY_DENIED: 'bg-red-100 text-red-800',
      EXIT_REQUEST: 'bg-yellow-100 text-yellow-800',
      EXIT_ALLOWED: 'bg-blue-100 text-blue-800',
      EXIT_DENIED: 'bg-red-100 text-red-800',
      TEST_DRIVE_OUT: 'bg-indigo-100 text-indigo-800',
      TEST_DRIVE_RETURN: 'bg-purple-100 text-purple-800',
      JOB_CREATED: 'bg-green-100 text-green-800',
      JOB_STATUS_CHANGED: 'bg-gray-100 text-gray-800',
      JOB_CLOSED: 'bg-gray-100 text-gray-800',
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  }

  openImagePreview(image: string, vehicleNumber: string) {
    this.selectedImage = image;
    this.selectedVehicle = vehicleNumber;
  }

  closeImagePreview() {
    this.selectedImage = null;
    this.selectedVehicle = '';
  }

  openLogDetail(log: GateLog) {
    this.selectedLog = log;
  }

  closeLogDetail() {
    this.selectedLog = null;
  }
}
