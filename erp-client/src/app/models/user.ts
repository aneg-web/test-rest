export interface User {
    id: string;
    password?: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    message: string;
    accessToken?: string;
    refreshToken?: string;
    error?: any;
  }
  
  export interface TokenResponse {
    success: boolean;
    accessToken: string;
    error?: any;
  }