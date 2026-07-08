export function Footer() {
  return (
    <footer className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
      <span suppressHydrationWarning>
        © {new Date().getFullYear()} Airsoft Event Manager
      </span>

      <div className="flex items-center gap-4">
        <a href="/admin/settings" className="hover:underline">
          Paramètres
        </a>
      </div>
    </footer>
  );
}
