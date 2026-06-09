import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/auth-store";

export function AppHeader(): React.JSX.Element {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout(): void {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <span className="text-lg font-semibold">DocTrack</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.full_name}</span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
