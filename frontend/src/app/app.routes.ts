import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./components/vehicle-list/vehicle-list.component').then((m) => m.VehicleListComponent),
      },
      {
        path: 'job-cards',
        loadComponent: () =>
          import('./components/job-card-list/job-card-list.component').then((m) => m.JobCardListComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./components/history/history.component').then((m) => m.HistoryComponent),
      },
      {
        path: 'cameras',
        loadComponent: () =>
          import('./components/camera-setup/camera-setup.component').then((m) => m.CameraSetupComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
