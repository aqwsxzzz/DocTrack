import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { login, register } from "./auth-api";
import { useAuthStore } from "../store/auth-store";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth-types";

export function useLoginMutation(): UseMutationResult<
  AuthResponse,
  Error,
  LoginRequest
> {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });
}

export function useRegisterMutation(): UseMutationResult<
  AuthResponse,
  Error,
  RegisterRequest
> {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });
}
