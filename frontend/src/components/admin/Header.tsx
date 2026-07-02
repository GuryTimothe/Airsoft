import { Menu } from "lucide-react";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2 bg-primary text-primary-foreground">
      <span className="font-semibold text-lg">Muret Airsoft</span>
    </header>
  );
}
