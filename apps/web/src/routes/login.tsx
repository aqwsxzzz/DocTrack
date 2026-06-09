import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { useAuthStore } from "@/features/auth/store/auth-store";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ingresar a DocTrack</CardTitle>
          <CardDescription>Accedé con tu correo y contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="font-medium text-foreground underline">
              Crear una
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
