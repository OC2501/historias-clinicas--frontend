export type AlertType = 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS';

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
