import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';

export type SignalColor = 'black' | 'green' | 'red';
export type SignalState = 'idle' | 'waiting' | 'accepted' | 'rejected';

@Component({
  selector: 'app-signal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signal.component.html',
})
export class SignalComponent implements OnDestroy {
  socketService = inject(SocketService);
  
  signalColor: SignalColor = 'black';
  signalState: SignalState = 'idle';
  vehicleNumber = '';
  message = '';
  private resetTimeout: any;

  constructor() {
    // Subscribe to signal events from socket service (via WebSocket)
    this.socketService.signalEvent$.subscribe((event) => {
      if (event) {
        this.showSignal(event.color, event.vehicleNumber, event.message);
      }
    });
  }

  showSignal(color: SignalColor, vehicleNumber: string, message: string) {
    // Clear any existing timeout
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
    
    this.signalColor = color;
    this.vehicleNumber = vehicleNumber;
    this.message = message;
    
    // Determine state based on color and message
    if (color === 'green') {
      this.signalState = 'accepted';
      // Green signal: reset to black after 10 seconds
      this.resetTimeout = setTimeout(() => this.resetToIdle(), 10000);
    } else if (color === 'red' && message.includes('Waiting')) {
      this.signalState = 'waiting';
      // Waiting state: stays red until accept/reject (no auto-reset)
    } else if (color === 'red') {
      this.signalState = 'rejected';
      // Rejected: reset to black after 10 seconds
      this.resetTimeout = setTimeout(() => this.resetToIdle(), 10000);
    } else {
      this.signalState = 'idle';
    }
  }

  resetToIdle() {
    this.signalColor = 'black';
    this.signalState = 'idle';
    this.vehicleNumber = '';
    this.message = '';
  }

  ngOnDestroy() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  getBackgroundClass(): string {
    switch (this.signalColor) {
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-black';
    }
  }

  getTextClass(): string {
    return this.signalColor === 'black' ? 'text-gray-600' : 'text-white';
  }
}
