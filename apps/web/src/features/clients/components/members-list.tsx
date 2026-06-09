import { Button } from "@/components/ui/button";
import type { ClientMember } from "../types/clients-types";

interface MembersListProps {
  members: ClientMember[];
  onRemove: (userId: string) => void;
  pendingRemoval: boolean;
}

export function MembersList({
  members,
  onRemove,
  pendingRemoval,
}: MembersListProps): React.JSX.Element {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin miembros asignados.</p>;
  }
  return (
    <ul className="divide-y rounded-md border">
      {members.map((member) => (
        <li
          key={member.id}
          className="flex items-center justify-between px-4 py-2"
        >
          <div>
            <p className="font-medium">{member.full_name}</p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pendingRemoval}
            onClick={() => onRemove(member.id)}
          >
            Quitar
          </Button>
        </li>
      ))}
    </ul>
  );
}
