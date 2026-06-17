import { createFileRoute } from "@tanstack/react-router";
import { OriginalsBrowser } from "@/features/vault/components/originals-browser";

export const Route = createFileRoute("/_authenticated/boveda/")({
  component: OriginalsBrowser,
});
