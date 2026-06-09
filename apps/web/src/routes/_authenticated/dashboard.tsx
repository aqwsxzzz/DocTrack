import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/auth-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Hola, {user?.full_name}</h1>
      <p className="text-muted-foreground">
        Bienvenido a DocTrack. Pronto vas a poder gestionar tus documentos acá.
      </p>
    </div>
  );
}
