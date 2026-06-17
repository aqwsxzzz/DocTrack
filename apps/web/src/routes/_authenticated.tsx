import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/features/auth/components/app-header";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { isTokenExpired } from "@/features/auth/lib/token";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    const { token, logout } = useAuthStore.getState();
    if (!token || isTokenExpired(token)) {
      logout();
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
