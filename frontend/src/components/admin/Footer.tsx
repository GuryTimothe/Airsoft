export function Footer() {
  return (
    <footer className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
      <div className="flex gap-4">
        <span>Status: 🟢 Online</span>
        <span>Users: 128</span>
      </div>

      <div className="flex gap-4">
        <span>v1.0.0</span>
        <a href="/admin/settings" className="hover:underline">
          Settings
        </a>
      </div>
    </footer>
  );
}
