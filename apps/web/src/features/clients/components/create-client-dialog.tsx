import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormTextField } from "@/components/form-text-field";
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateClientMutation } from "../api/clients-queries";

const clientSchema = z.object({
  name: z.string().min(1, "Requerido").max(255),
  notes: z.string().max(10_000).optional(),
});

type ClientValues = z.infer<typeof clientSchema>;

export function CreateClientDialog(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const mutation = useCreateClientMutation();
  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", notes: "" },
  });

  function onSubmit(values: ClientValues): void {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("Cliente creado");
        setOpen(false);
        form.reset();
      },
      onError: () => toast.error("No se pudo crear el cliente"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo cliente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>Cargá los datos del cliente.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormTextField control={form.control} name="name" label="Nombre" />
            <FormTextField control={form.control} name="notes" label="Notas" />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creando…" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
