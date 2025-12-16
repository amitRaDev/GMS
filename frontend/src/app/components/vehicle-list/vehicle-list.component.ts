import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Vehicle } from '../../models';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-list.component.html',
})
export class VehicleListComponent implements OnInit {
  private api = inject(ApiService);
  vehicles = signal<Vehicle[]>([]);
  filteredVehicles = signal<Vehicle[]>([]);
  searchTerm = '';
  showModal = false;
  showJobModal = false;
  selectedVehicle: Vehicle | null = null;
  jobDescription = '';
  formData: Partial<Vehicle> = {};

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.api.getVehicles().subscribe((data) => {
      this.vehicles.set(data);
      this.filterVehicles();
    });
  }

  filterVehicles() {
    const term = this.searchTerm.toLowerCase();
    this.filteredVehicles.set(
      !term
        ? this.vehicles()
        : this.vehicles().filter(
            (v) => v.vehicleNumber.toLowerCase().includes(term) || v.ownerName?.toLowerCase().includes(term)
          )
    );
  }

  createJobForVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.jobDescription = '';
    this.showJobModal = true;
  }

  submitJob() {
    if (!this.selectedVehicle) return;
    this.api.createJobCard({
      vehicleNumber: this.selectedVehicle.vehicleNumber,
      serviceDescription: this.jobDescription || 'General Service',
    }).subscribe(() => { this.showJobModal = false; });
  }

  closeModal() {
    this.showModal = false;
    this.formData = {};
  }

  saveVehicle() {
    if (!this.formData.vehicleNumber) return;
    this.api.createVehicle(this.formData).subscribe(() => {
      this.closeModal();
      this.loadVehicles();
    });
  }
}
