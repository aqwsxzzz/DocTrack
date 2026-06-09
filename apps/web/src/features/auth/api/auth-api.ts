import { apiClient } from "@/lib/api-client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth-types";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", data);
  return response.data;
}

export async function fetchMe(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}
