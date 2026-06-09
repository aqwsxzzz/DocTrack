import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useClientsQuery } from "@/features/clients/api/clients-queries";
import { useCreateOriginalMutation } from "../api/vault-queries";
import { TENDER_TYPES, type TenderType } from "../types/vault-types";

const NO_OWNER = "__none__";

export function CreateOriginalDialog({
  clientId,
}: {
  clientId: string;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [tenderType, setTenderType] = useState<TenderType>("Mantenimiento de oferta");
  const [tenderNumber, setTenderNumber] = useState("");
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState(NO_OWNER);
  const [expiration, setExpiration] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const clientsQuery = useClientsQuery({ limit: 100, offset: 0, search: "" });
  const mutation = useCreateOriginalMutation(clientId);

  function handleSubmit(): void {
    if (!tenderNumber.trim() || !title.trim()) {
      toast.error("Completá el número de licitación y el título");
      return;
    }
    mutation.mutate(
      {
        tender_type: tenderType,
        tender_number: tenderNumber.trim(),
        title: title.trim(),
        external_owner_id: ownerId === NO_OWNER ? null : ownerId,
        contract_expiration_date: expiration || null,
        file,
      },
      {
        onSuccess: () => {
          toast.success("Original registrado");
          setOpen(false);
          setTenderNumber("");
          setTitle("");
          setExpiration("");
          setFile(null);
        },
        onError: () => toast.error("No se pudo registrar el original"),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Registrar original</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar fianza original</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de licitación</Label>
            <Select
              value={tenderType}
              onValueChange={(value) => setTenderType(value as TenderType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TENDER_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tender-number">Número de licitación</Label>
            <Input
              id="tender-number"
              value={tenderNumber}
              onChange={(event) => setTenderNumber(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="original-title">Título</Label>
            <Input
              id="original-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Propietario / destino de devolución</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_OWNER}>Sin especificar</SelectItem>
                {clientsQuery.data?.items.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiration">Vencimiento del contrato</Label>
            <Input
              id="expiration"
              type="date"
              value={expiration}
              onChange={(event) => setExpiration(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup-file">Copia de respaldo (opcional)</Label>
            <Input
              id="backup-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
