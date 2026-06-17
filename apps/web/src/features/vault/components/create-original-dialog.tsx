import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  TENDER_TYPES,
  type HolderSelection,
  type TenderType,
} from "../types/vault-types";
import { InitialHolderField } from "./initial-holder-field";

const NO_OWNER = "__none__";

export function CreateOriginalDialog({
  clientId,
}: {
  clientId?: string;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(clientId ?? "");
  const [tenderType, setTenderType] = useState<TenderType>("Mantenimiento de oferta");
  const [tenderNumber, setTenderNumber] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(NO_OWNER);
  const [expiration, setExpiration] = useState("");
  const [holder, setHolder] = useState<HolderSelection | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const clientsQuery = useClientsQuery({ limit: 100, offset: 0, search: "" });
  const mutation = useCreateOriginalMutation();

  function handleSubmit(): void {
    const targetClient = clientId ?? selectedClient;
    if (!targetClient) {
      toast.error("Elegí un cliente");
      return;
    }
    if (!tenderNumber.trim() || !description.trim()) {
      toast.error("Completá el número de licitación y la descripción");
      return;
    }
    mutation.mutate(
      {
        clientId: targetClient,
        input: {
          tender_type: tenderType,
          tender_number: tenderNumber.trim(),
          description: description.trim(),
          external_owner_id: ownerId === NO_OWNER ? null : ownerId,
          contract_expiration_date: expiration || null,
          file,
          ...(holder ?? {}),
        },
      },
      {
        onSuccess: () => {
          toast.success("Original registrado");
          setOpen(false);
          setTenderNumber("");
          setDescription("");
          setExpiration("");
          setHolder(null);
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
          {!clientId && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegí un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientsQuery.data?.items.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Tipo de fianza</Label>
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
            <Label htmlFor="original-description">Descripción</Label>
            <Textarea
              id="original-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <InitialHolderField
            key={open ? "open" : "closed"}
            onChange={setHolder}
          />
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
