import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useAuthStore } from "@/features/auth/store/auth-store";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (useAuthStore.getState().token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Registrate para acceder a DocTrack.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="font-medium text-foreground underline">
              Ingresar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
