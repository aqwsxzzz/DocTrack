import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientsQuery } from "@/features/clients/api/clients-queries";
import { useCreateSeguroMutation } from "../api/library-queries";
import { emptySeguroForm, formToInput } from "./seguro-form";
import { SeguroFields } from "./seguro-form-fields";

export function CreateSeguroDialog({
  clientId,
}: {
  clientId?: string;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(clientId ?? "");
  const [form, setForm] = useState(emptySeguroForm);
  const clientsQuery = useClientsQuery({ limit: 100, offset: 0, search: "" });
  const mutation = useCreateSeguroMutation();

  function handleSubmit(): void {
    const targetClient = clientId ?? selectedClient;
    if (!targetClient) {
      toast.error("Elegí un cliente");
      return;
    }
    if (!form.numeroPoliza.trim() || !form.vigenciaDesde) {
      toast.error("Completá el número de póliza y la vigencia desde");
      return;
    }
    mutation.mutate(
      { clientId: targetClient, input: formToInput(form) },
      {
        onSuccess: () => {
          toast.success("Seguro creado");
          setOpen(false);
          setForm(emptySeguroForm);
        },
        onError: () => toast.error("No se pudo crear el seguro"),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo seguro</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo seguro</DialogTitle>
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
          <SeguroFields value={form} onChange={setForm} />
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
