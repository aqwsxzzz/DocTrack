import { Link } from "@tanstack/react-router";

const tabClass =
  "border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-muted-foreground [&.active]:border-foreground [&.active]:text-foreground";

export function SectionTabs(): React.JSX.Element {
  return (
    <nav className="flex gap-6 border-b">
      <Link to="/seguros" className={tabClass} activeOptions={{ exact: false }}>
        Documentación
      </Link>
      <Link to="/boveda" className={tabClass} activeOptions={{ exact: false }}>
        Bóveda
      </Link>
    </nav>
  );
}
