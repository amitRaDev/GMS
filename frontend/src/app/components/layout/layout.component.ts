import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SocketService, GateAlert } from '../../services/socket.service';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import { AlertsComponent } from '../alerts/alerts.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AlertsComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  socket = inject(SocketService);
  theme = inject(ThemeService);
  private api = inject(ApiService);

  handleCloseJob(alert: GateAlert) {
    if (alert.jobCardId) {
      this.api.forceCloseJob(alert.jobCardId).subscribe();
    }
  }
}
