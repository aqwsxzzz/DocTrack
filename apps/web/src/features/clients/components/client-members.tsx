import { toast } from "sonner";
import {
  useMembersQuery,
  useRemoveMemberMutation,
  useUsersQuery,
} from "../api/clients-queries";
import { AddMemberControl } from "./add-member-control";
import { MembersList } from "./members-list";

interface ClientMembersProps {
  clientId: string;
}

export function ClientMembers({ clientId }: ClientMembersProps): React.JSX.Element {
  const membersQuery = useMembersQuery(clientId);
  const usersQuery = useUsersQuery();
  const removeMutation = useRemoveMemberMutation(clientId);

  if (membersQuery.isPending || usersQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (membersQuery.isError || usersQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudieron cargar los miembros.
      </p>
    );
  }

  const memberIds = new Set(membersQuery.data.map((member) => member.id));
  const candidates = usersQuery.data.filter((user) => !memberIds.has(user.id));

  function handleRemove(userId: string): void {
    removeMutation.mutate(userId, {
      onSuccess: () => toast.success("Miembro quitado"),
      onError: () => toast.error("No se pudo quitar el miembro"),
    });
  }

  return (
    <div className="space-y-4">
      <AddMemberControl clientId={clientId} candidates={candidates} />
      <MembersList
        members={membersQuery.data}
        onRemove={handleRemove}
        pendingRemoval={removeMutation.isPending}
      />
    </div>
  );
}
