
export interface Scene {
  id: number;
  prompt: string;
  imageUrl?: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface CreditState {
  remaining: number;
  isInfinite: boolean;
}

export enum AppState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD'
}
