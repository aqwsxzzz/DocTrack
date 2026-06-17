import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/auth-store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { token } = useAuthStore.getState();
    throw redirect({ to: token ? "/seguros" : "/login" });
  },
});
