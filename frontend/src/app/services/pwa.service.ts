import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredPrompt: any = null;
  
  canInstall = signal(false);
  isInstalled = signal(false);
  isDismissed = signal(false);

  constructor() {
    this.checkIfInstalled();
    this.checkIfDismissed();
    this.listenForInstallPrompt();
  }

  private checkIfInstalled() {
    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    this.isInstalled.set(isStandalone || isIosStandalone);
  }

  private checkIfDismissed() {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      // Auto-show again after 7 days
      const dismissedAt = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) {
        this.isDismissed.set(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
  }

  dismiss() {
    this.isDismissed.set(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  private listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });
  }

  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      return true;
    }
    
    return false;
  }
}
