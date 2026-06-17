import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listUsers } from "@/features/clients/api/clients-api";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { HolderSelection } from "../types/vault-types";

type HolderMode = "none" | "label" | "user";

export function InitialHolderField({
  onChange,
}: {
  onChange: (value: HolderSelection | null) => void;
}): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [mode, setMode] = useState<HolderMode>("none");
  const [label, setLabel] = useState("");
  const [userId, setUserId] = useState("");
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: isAdmin && mode === "user",
  });
  const candidates = isAdmin
    ? (usersQuery.data ?? [])
    : user
      ? [{ id: user.id, full_name: user.full_name }]
      : [];

  function changeMode(next: HolderMode): void {
    setMode(next);
    setLabel("");
    setUserId("");
    onChange(null);
  }
  function changeLabel(value: string): void {
    setLabel(value);
    onChange(value.trim() ? { holder_label: value.trim() } : null);
  }
  function changeUser(value: string): void {
    setUserId(value);
    onChange(value ? { holder_user_id: value } : null);
  }

  return (
    <div className="space-y-2">
      <Label>Tenedor inicial (opcional)</Label>
      <Select value={mode} onValueChange={(value) => changeMode(value as HolderMode)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin tenedor</SelectItem>
          <SelectItem value="label">Etiqueta (externo / devuelto)</SelectItem>
          <SelectItem value="user">Usuario de la app</SelectItem>
        </SelectContent>
      </Select>
      {mode === "label" && (
        <Input
          placeholder="Ej. Estudio Jurídico…"
          value={label}
          onChange={(event) => changeLabel(event.target.value)}
        />
      )}
      {mode === "user" && (
        <Select value={userId} onValueChange={changeUser}>
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
    </div>
  );
}
