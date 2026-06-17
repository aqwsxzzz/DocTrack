import { Link, useNavigate } from "@tanstack/react-router";
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
      <nav className="flex items-center gap-4">
        <Link to="/seguros" className="text-lg font-semibold">
          DocTrack
        </Link>
        {user?.role === "admin" && (
          <Link
            to="/admin/clients"
            className="text-sm text-muted-foreground [&.active]:text-foreground"
          >
            Clientes
          </Link>
        )}
      </nav>
      <div className="flex items-center gap-4">
        <Link
          to="/account"
          className="text-sm text-muted-foreground [&.active]:text-foreground"
        >
          {user?.full_name}
        </Link>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
