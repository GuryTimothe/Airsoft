"use client";

import { UserForm } from "@/components/admin/user-form";

export default function NewUserPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nouvel utilisateur
        </h1>
        <p className="text-sm text-muted-foreground">
          Creez un nouveau compte utilisateur et definissez son role.
        </p>
      </div>

      <UserForm />
    </main>
  );
}
