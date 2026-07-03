"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  loginSchema,
  registerSchema,
  guardianSchema,
  RegisterInput,
  LoginInput,
  GuardianInput,
} from "@/lib/schemas/auth";

type Mode = "login" | "register";

interface Props {
  mode?: Mode;
}

export default function AuthForm({ mode = "login" }: Props) {
  const [showGuardian, setShowGuardian] = useState(false);
  const [pendingRegister, setPendingRegister] = useState<RegisterInput | null>(
    null,
  );
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const resolver = zodResolver(mode === "login" ? loginSchema : registerSchema);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Record<string, unknown>>({ resolver, mode: "onTouched" });

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    const collect = (value: unknown) => {
      if (!value || typeof value !== "object") return;

      if (
        value &&
        typeof (value as Record<string, unknown>).message === "string"
      ) {
        messages.push((value as Record<string, unknown>).message);
      }

      for (const item of Object.values(value as Record<string, unknown>)) {
        if (item && typeof item === "object") {
          collect(item);
        }
      }
    };

    collect(errors);
    return Array.from(new Set(messages));
  }, [errors]);

  function onError() {
    setStatus({
      type: "error",
      message: "Veuillez corriger les erreurs du formulaire.",
    });
  }

  useEffect(() => {
    if (showGuardian) {
      dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [showGuardian]);

  function onSubmit(data: LoginInput | RegisterInput) {
    setStatus(null);

    if (mode === "register") {
      const reg = data as RegisterInput;
      if (reg.age < 18) {
        setPendingRegister(reg);
        setShowGuardian(true);
        return;
      }

      // TODO: call API /register
      console.log("register payload", reg);
      setStatus({ type: "success", message: "Inscription réussie (simulée)" });
      reset();
      return;
    }

    console.log("login payload", data as LoginInput);
    setStatus({ type: "success", message: "Connexion réussie (simulée)" });
    reset();
  }

  function onGuardianSubmit(values: GuardianInput) {
    if (!pendingRegister) return;

    const payload = { ...pendingRegister, guardian: values };
    // TODO: call API /register with guardian
    console.log("register minor payload", payload);
    setShowGuardian(false);
    setPendingRegister(null);
    setStatus({
      type: "success",
      message:
        "Inscription mineur enregistrée (simulée). Email de récapitulatif prêt à être envoyé.",
    });
    reset();
  }

  return (
    <div className="max-w-md">
      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className="space-y-4"
        noValidate
      >
        {validationMessages.length > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded border border-destructive/70 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <p className="font-semibold">
              Veuillez corriger les erreurs suivantes :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationMessages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {mode === "register" && (
          <div>
            <label
              htmlFor="name"
              className="block text-sm text-muted-foreground"
            >
              Nom
            </label>
            <input
              id="name"
              {...register("name")}
              className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
              placeholder="Prénom Nom"
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <div
                id="name-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.name.message}
              </div>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            {...register("email")}
            className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
            placeholder="you@exemple.com"
            type="email"
            autoComplete="username"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <div
              id="email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.email.message}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm text-muted-foreground"
          >
            Mot de passe
          </label>
          <input
            id="password"
            {...register("password")}
            className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
            type="password"
            placeholder="••••••••"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <div
              id="password-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.password.message}
            </div>
          )}
        </div>

        {mode === "register" && (
          <>
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm text-muted-foreground"
              >
                Confirmer
              </label>
              <input
                id="confirm"
                {...register("confirm")}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.confirm}
                aria-describedby={errors.confirm ? "confirm-error" : undefined}
              />
              {errors.confirm && (
                <div
                  id="confirm-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.confirm.message}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-sm text-muted-foreground"
              >
                Âge
              </label>
              <input
                id="age"
                {...register("age", { valueAsNumber: true })}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                type="number"
                min={0}
                inputMode="numeric"
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "age-error" : undefined}
              />
              {errors.age && (
                <div
                  id="age-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.age.message}
                </div>
              )}
            </div>
          </>
        )}

        {status && (
          <div
            role="status"
            aria-live="polite"
            className={`text-sm ${status.type === "success" ? "text-success" : "text-destructive"}`}
          >
            {status.message}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </Button>
        </div>
      </form>

      {showGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guardian-title"
            className="w-full max-w-lg rounded bg-card p-6 shadow-xl"
          >
            <h3 id="guardian-title" className="mb-2 text-lg font-semibold">
              Consentement responsable légal
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              L&apos;utilisateur est mineur. Veuillez remplir les informations
              du responsable légal et cocher l&apos;accord pour poursuivre.
            </p>

            <GuardianForm
              onSubmit={onGuardianSubmit}
              onCancel={() => {
                setShowGuardian(false);
                setPendingRegister(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GuardianForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: GuardianInput) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuardianInput>({ resolver: zodResolver(guardianSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label
          htmlFor="guardianName"
          className="block text-sm text-muted-foreground"
        >
          Nom du responsable
        </label>
        <input
          id="guardianName"
          {...register("guardianName")}
          className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
          autoComplete="name"
          aria-invalid={!!errors.guardianName}
          aria-describedby={
            errors.guardianName ? "guardianName-error" : undefined
          }
        />
        {errors.guardianName && (
          <div
            id="guardianName-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.guardianName.message}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="guardianEmail"
          className="block text-sm text-muted-foreground"
        >
          Email du responsable
        </label>
        <input
          id="guardianEmail"
          {...register("guardianEmail")}
          className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.guardianEmail}
          aria-describedby={
            errors.guardianEmail ? "guardianEmail-error" : undefined
          }
        />
        {errors.guardianEmail && (
          <div
            id="guardianEmail-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.guardianEmail.message}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="guardianPhone"
          className="block text-sm text-muted-foreground"
        >
          Téléphone
        </label>
        <input
          id="guardianPhone"
          {...register("guardianPhone")}
          className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={!!errors.guardianPhone}
          aria-describedby={
            errors.guardianPhone ? "guardianPhone-error" : undefined
          }
        />
        {errors.guardianPhone && (
          <div
            id="guardianPhone-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.guardianPhone.message}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="guardianConsent"
          {...register("guardianConsent")}
          type="checkbox"
          aria-invalid={!!errors.guardianConsent}
          aria-describedby={
            errors.guardianConsent ? "guardianConsent-error" : undefined
          }
        />
        <label
          htmlFor="guardianConsent"
          className="text-sm text-muted-foreground"
        >
          J&apos;autorise le responsable légal
        </label>
      </div>
      {errors.guardianConsent && (
        <div
          id="guardianConsent-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {errors.guardianConsent.message}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Valider et enregistrer</Button>
      </div>
    </form>
  );
}
