import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Camera, CreateCameraDto } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-camera-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camera-setup.component.html',
})
export class CameraSetupComponent implements OnInit {
  private api = inject(ApiService);

  cameras = signal<Camera[]>([]);
  showCreateModal = false;
  showTokenModal = false;
  selectedCamera: Camera | null = null;
  copiedToken = false;

  createForm: CreateCameraDto = {
    cameraId: '',
    name: '',
    location: '',
    gateType: 'BOTH',
    description: '',
  };

  get apiEndpoint(): string {
    return `${environment.apiUrl}/camera/event`;
  }

  ngOnInit() {
    this.loadCameras();
  }

  loadCameras() {
    this.api.getCameras().subscribe((cameras) => this.cameras.set(cameras));
  }

  openCreateModal() {
    this.createForm = { cameraId: '', name: '', location: '', gateType: 'BOTH', description: '' };
    this.showCreateModal = true;
  }

  submitCreate() {
    if (!this.createForm.cameraId || !this.createForm.name) return;
    this.api.createCamera(this.createForm).subscribe(() => {
      this.showCreateModal = false;
      this.loadCameras();
    });
  }

  toggleActive(camera: Camera) {
    this.api.updateCamera(camera.id, { isActive: !camera.isActive }).subscribe(() => {
      this.loadCameras();
    });
  }

  showToken(camera: Camera) {
    this.selectedCamera = camera;
    this.showTokenModal = true;
    this.copiedToken = false;
  }

  regenerateToken() {
    if (!this.selectedCamera) return;
    this.api.regenerateCameraToken(this.selectedCamera.id).subscribe((updated) => {
      this.selectedCamera = updated;
      this.loadCameras();
    });
  }

  copyToken() {
    if (!this.selectedCamera?.apiToken) return;
    navigator.clipboard.writeText(this.selectedCamera.apiToken);
    this.copiedToken = true;
    setTimeout(() => (this.copiedToken = false), 2000);
  }

  copyEndpoint() {
    navigator.clipboard.writeText(this.apiEndpoint);
  }

  copyCurlExample() {
    if (!this.selectedCamera) return;
    const curl = `curl --location '${this.apiEndpoint}' \\
  --header 'Content-Type: application/json' \\
  --header 'Authorization: Bearer ${this.selectedCamera.apiToken}' \\
  --data '{
    "cameraId": "${this.selectedCamera.cameraId}",
    "registrationNumber": "MH12AB1234",
    "movementType": "IN",
    "time": "${new Date().toISOString()}",
    "vehicleType": "Car",
    "image": "data:image/png;base64,..."
  }'`;
    navigator.clipboard.writeText(curl);
  }

  deleteCamera(camera: Camera) {
    if (!confirm(`Delete camera "${camera.name}"?`)) return;
    this.api.deleteCamera(camera.id).subscribe(() => this.loadCameras());
  }

  getGateTypeClass(type: string) {
    return {
      IN: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      OUT: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      BOTH: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    }[type] || '';
  }
}
