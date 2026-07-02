"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { login, registerUser } from "@/lib/auth";
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
  const router = useRouter();
  const searchParams = useSearchParams();
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
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<Record<string, unknown>>({ resolver, mode: "onTouched" });

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    const collect = (value: unknown) => {
      if (!value || typeof value !== "object") return;

      const maybeMessage = (value as Record<string, unknown>).message;
      if (typeof maybeMessage === "string") {
        messages.push(maybeMessage);
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

  useEffect(() => {
    if (mode !== "login") {
      return;
    }

    const emailParam = searchParams.get("email");
    if (emailParam) {
      setValue("email", emailParam, { shouldValidate: true });
    }
  }, [mode, searchParams, setValue]);

  function computeAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (0 === monthDiff && dayDiff < 0)) {
      age -= 1;
    }

    return age;
  }

  async function submitRegister(reg: RegisterInput) {
    await registerUser({
      firstname: reg.firstname.trim(),
      lastname: reg.lastname.trim(),
      email: reg.email,
      password: reg.password,
      dateOfBirth: reg.dateOfBirth,
      pseudo: reg.pseudo?.trim() || undefined,
      phone: reg.phone?.trim() || undefined,
    });

    setStatus({
      type: "success",
      message: "Compte créé. Connectez-vous pour continuer.",
    });
    reset();
    router.push(`/auth/login?email=${encodeURIComponent(reg.email)}`);
  }

  async function onSubmit(data: Record<string, unknown>) {
    setStatus(null);

    if (mode === "register") {
      const reg = data as RegisterInput;
      if (computeAge(reg.dateOfBirth) < 18) {
        setPendingRegister(reg);
        setShowGuardian(true);
        return;
      }

      try {
        await submitRegister(reg);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de créer le compte.";
        setStatus({ type: "error", message });
      }
      return;
    }

    try {
      const loginInput: LoginInput = {
        email: String(data.email ?? ""),
        password: String(data.password ?? ""),
      };

      await login(loginInput);
      setStatus({ type: "success", message: "Connexion réussie." });
      reset();
      router.push("/admin");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de se connecter.";
      setStatus({ type: "error", message });
    }
  }

  async function onGuardianSubmit(values: GuardianInput) {
    if (!pendingRegister) return;

    try {
      // Backend register endpoint currently ignores guardian details.
      void values;
      await submitRegister(pendingRegister);
      setShowGuardian(false);
      setPendingRegister(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de créer le compte.";
      setStatus({ type: "error", message });
    }
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
          <>
            <div>
              <label
                htmlFor="lastname"
                className="block text-sm text-muted-foreground"
              >
                Nom
              </label>
              <input
                id="lastname"
                {...register("lastname")}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                placeholder="Dupont"
                autoComplete="family-name"
                aria-invalid={!!errors.lastname}
                aria-describedby={
                  errors.lastname ? "lastname-error" : undefined
                }
              />
              {errors.lastname && (
                <div
                  id="lastname-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.lastname.message}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="firstname"
                className="block text-sm text-muted-foreground"
              >
                Prénom
              </label>
              <input
                id="firstname"
                {...register("firstname")}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                placeholder="Jean"
                autoComplete="given-name"
                aria-invalid={!!errors.firstname}
                aria-describedby={
                  errors.firstname ? "firstname-error" : undefined
                }
              />
              {errors.firstname && (
                <div
                  id="firstname-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.firstname.message}
                </div>
              )}
            </div>
          </>
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
                htmlFor="dateOfBirth"
                className="block text-sm text-muted-foreground"
              >
                Date de naissance
              </label>
              <input
                id="dateOfBirth"
                {...register("dateOfBirth")}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                type="date"
                autoComplete="bday"
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={
                  errors.dateOfBirth ? "dateOfBirth-error" : undefined
                }
              />
              {errors.dateOfBirth && (
                <div
                  id="dateOfBirth-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.dateOfBirth.message}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="pseudo"
                className="block text-sm text-muted-foreground"
              >
                Pseudo (optionnel)
              </label>
              <input
                id="pseudo"
                {...register("pseudo")}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                placeholder="MonPseudo"
                autoComplete="nickname"
                aria-invalid={!!errors.pseudo}
                aria-describedby={errors.pseudo ? "pseudo-error" : undefined}
              />
              {errors.pseudo && (
                <div
                  id="pseudo-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.pseudo.message}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm text-muted-foreground"
              >
                Téléphone (optionnel)
              </label>
              <input
                id="phone"
                {...register("phone")}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                placeholder="0612345678"
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {errors.phone && (
                <div
                  id="phone-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.phone.message}
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
          <Button type="submit" disabled={isSubmitting}>
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
