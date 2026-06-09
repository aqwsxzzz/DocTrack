import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listUsers } from "@/features/clients/api/clients-api";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useAddCustodyMutation } from "../api/vault-queries";
import type { AddCustodyInput } from "../types/vault-types";

type HolderMode = "label" | "user";

export function AddCustodyForm({
  originalId,
}: {
  originalId: string;
}): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [mode, setMode] = useState<HolderMode>("label");
  const [label, setLabel] = useState("");
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const mutation = useAddCustodyMutation(originalId);
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: isAdmin,
  });

  const candidates = isAdmin
    ? (usersQuery.data ?? [])
    : user
      ? [{ id: user.id, full_name: user.full_name }]
      : [];

  function handleSubmit(): void {
    const input: AddCustodyInput =
      mode === "user"
        ? { holder_user_id: userId }
        : { holder_label: label.trim() };
    if (mode === "user" ? !userId : !label.trim()) {
      toast.error("Indicá quién tiene el original");
      return;
    }
    mutation.mutate(
      { ...input, note: note.trim() || null },
      {
        onSuccess: () => {
          toast.success("Movimiento registrado");
          setLabel("");
          setUserId("");
          setNote("");
        },
        onError: () => toast.error("No se pudo registrar el movimiento"),
      },
    );
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="space-y-2">
        <Label>Nuevo tenedor</Label>
        <Select value={mode} onValueChange={(value) => setMode(value as HolderMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="label">Etiqueta (externo / devuelto)</SelectItem>
            <SelectItem value="user">Usuario de la app</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === "label" ? (
        <Input
          placeholder="Ej. Devuelto, Estudio Jurídico…"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
      ) : (
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí un usuario" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input
        placeholder="Nota (opcional)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <Button onClick={handleSubmit} disabled={mutation.isPending}>
        {mutation.isPending ? "Registrando…" : "Registrar movimiento"}
      </Button>
    </div>
  );
}
