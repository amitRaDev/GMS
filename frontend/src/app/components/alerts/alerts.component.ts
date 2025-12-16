import { Component, inject, output } from '@angular/core';
import { SocketService, GateAlert } from '../../services/socket.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  templateUrl: './alerts.component.html',
})
export class AlertsComponent {
  socketService = inject(SocketService);

  createJob = output<GateAlert>();
  closeJob = output<GateAlert>();

  onCreateJob(alert: GateAlert) {
    this.createJob.emit(alert);
    this.socketService.dismissAlert(alert.vehicleNumber);
  }

  onCloseJob(alert: GateAlert) {
    this.closeJob.emit(alert);
    if (alert.jobCardId) {
      this.socketService.dismissAlertByJob(alert.jobCardId);
    }
  }

  dismiss(alert: GateAlert) {
    if (alert.jobCardId) {
      this.socketService.dismissAlertByJob(alert.jobCardId);
    } else {
      this.socketService.dismissAlert(alert.vehicleNumber);
    }
  }
}
