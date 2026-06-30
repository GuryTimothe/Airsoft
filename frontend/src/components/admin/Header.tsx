import { Menu } from "lucide-react";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2 bg-background">
      <button onClick={onToggleSidebar}>
        <Menu className="h-5 w-5" />
      </button>

      <span className="font-semibold text-sm">Muret Airsoft Admin</span>
    </header>
  );
}
