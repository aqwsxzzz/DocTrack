import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/auth-store";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    if (useAuthStore.getState().user?.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
