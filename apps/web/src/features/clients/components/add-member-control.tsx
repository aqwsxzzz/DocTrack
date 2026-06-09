import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddMemberMutation } from "../api/clients-queries";
import type { AssignableUser } from "../types/clients-types";

interface AddMemberControlProps {
  clientId: string;
  candidates: AssignableUser[];
}

export function AddMemberControl({
  clientId,
  candidates,
}: AddMemberControlProps): React.JSX.Element {
  const [userId, setUserId] = useState("");
  const mutation = useAddMemberMutation(clientId);

  function handleAdd(): void {
    if (!userId) {
      return;
    }
    mutation.mutate(userId, {
      onSuccess: () => {
        toast.success("Miembro agregado");
        setUserId("");
      },
      onError: () => toast.error("No se pudo agregar el miembro"),
    });
  }

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay usuarios disponibles para agregar.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={userId} onValueChange={setUserId}>
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Elegí un usuario" />
        </SelectTrigger>
        <SelectContent>
          {candidates.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAdd} disabled={!userId || mutation.isPending}>
        Agregar
      </Button>
    </div>
  );
}
