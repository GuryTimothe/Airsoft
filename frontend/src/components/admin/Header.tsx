import { Menu } from "lucide-react";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2 bg-primary text-primary-foreground">
      <button
        aria-label="Basculer la barre latérale"
        onClick={onToggleSidebar}
        className="p-1 rounded-md hover:bg-primary/10"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="font-semibold text-lg">Muret Airsoft</span>
    </header>
  );
}
