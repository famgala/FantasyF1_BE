import api, { parseApiError, ApiError } from "./api";

/**
 * Response type for email existence check
 */
export interface EmailCheckResponse {
  exists: boolean;
}

/**
 * Check if email exists in the system
 * @param email - Email address to check
 * @returns Promise with exists boolean
 * @throws ApiError if request fails
 * 
 * NOTE: Requires backend endpoint GET /api/v1/auth/check-email?email={email}
 * This endpoint should be rate-limited to prevent enumeration attacks.
 */
export const checkEmailExists = async (email: string): Promise<EmailCheckResponse> => {
  try {
    const response = await api.get<EmailCheckResponse>("/auth/check-email", {
      params: { email },
    });
    return response.data;
  } catch (error) {
    throw parseApiError(error);
  }
};

/**
 * Login request payload
 */
export interface LoginRequest {
  username: string; // email is used as username
  password: string;
}

/**
 * Login response with tokens
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/**
 * Authenticate user with credentials
 * @param credentials - Username/email and password
 * @returns Promise with access and refresh tokens
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // FastAPI OAuth2 expects form data
    const formData = new URLSearchParams();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);

    const response = await api.post<LoginResponse>("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Store tokens
    localStorage.setItem("access_token", response.data.access_token);
    localStorage.setItem("refresh_token", response.data.refresh_token);

    return response.data;
  } catch (error) {
    throw parseApiError(error);
  }
};

/**
 * Registration request payload
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

/**
 * Register new user
 * @param data - Registration data
 * @returns Promise with created user info
 */
export const register = async (data: RegisterRequest): Promise<{ id: number; email: string }> => {
  try {
    const response = await api.post("/auth/register", data);
    return response.data;
  } catch (error) {
    throw parseApiError(error);
  }
};

/**
 * Request password reset email
 * @param email - Email address to send reset link to
 * @returns Promise indicating success
 * 
 * NOTE: Requires backend endpoint POST /api/v1/auth/forgot-password
 * For security, always returns success even if email doesn't exist (prevents enumeration)
 */
export const forgotPassword = async (email: string): Promise<void> => {
  try {
    await api.post("/auth/forgot-password", { email });
  } catch (error) {
    // For security, don't throw error - always show generic message
    // Real backend should also return 200 even if email doesn't exist
    parseApiError(error);
  }
};

/**
 * Reset password request payload
 */
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

/**
 * Reset password with token from email link
 * @param data - Token and new password
 * @returns Promise indicating success
 * 
 * NOTE: Requires backend endpoint POST /api/v1/auth/reset-password
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  try {
    await api.post("/auth/reset-password", data);
  } catch (error) {
    throw parseApiError(error);
  }
};

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Refresh token response with new access token
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string; // Optional - some APIs return new refresh token too
  token_type: string;
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - The refresh token from localStorage
 * @returns Promise with new tokens
 * @throws ApiError if refresh fails or token is expired
 * 
 * NOTE: Requires backend endpoint POST /api/v1/auth/refresh
 * Body should contain refresh_token field
 */
export const refreshToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  try {
    // FastAPI expects form data for OAuth2 refresh
    const formData = new URLSearchParams();
    formData.append("refresh_token", refreshToken);
    formData.append("grant_type", "refresh_token");

    const response = await api.post<RefreshTokenResponse>("/auth/refresh", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      // Skip the default auth interceptor for refresh endpoint
      // This prevents circular dependency where we need token to refresh token
      skipAuth: true,
    });

    // Update stored tokens
    localStorage.setItem("access_token", response.data.access_token);
    
    // Update refresh token if provided (some APIs rotate refresh tokens)
    if (response.data.refresh_token) {
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }

    return response.data;
  } catch (error) {
    // If refresh fails, clear tokens and force logout
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw parseApiError(error);
  }
};

/**
 * Clear authentication tokens and logout
 * Redirects to homepage after clearing tokens
 * @param redirect - Whether to redirect to homepage (default: true)
 */
export const logout = (redirect: boolean = true): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  
  if (redirect) {
    window.location.href = "/";
  }
};

/**
 * Check if user is authenticated (has valid token stored)
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("access_token");
};

/**
 * Get the current access token from storage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem("access_token");
};

/**
 * Get the current refresh token from storage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token");
};

export type { ApiError };
