export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  user_metadata?: {
    phone_verified?: boolean;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: AuthUser;
}

export interface OTPResponse {
  success: boolean;
  error: string | null;
  data?: any;
  session?: AuthSession;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
