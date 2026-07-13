"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { login, registerUser } from "@/lib/auth";
import { serializeEmergencyContact } from "@/lib/emergency-contact";
import { getCurrentUser } from "@/lib/user-api";
import {
  loginSchema,
  registerSchema,
  RegisterInput,
  LoginInput,
} from "@/lib/schemas/auth";

type Mode = "login" | "register";

interface Props {
  mode?: Mode;
}

export default function AuthForm({ mode = "login" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const resolver = zodResolver(mode === "login" ? loginSchema : registerSchema);

  type FormData = LoginInput | RegisterInput;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = useForm<FormData>({ resolver, mode: "onTouched" });

  // Type-safe error access based on mode
  const getError = (field: string): string | undefined => {
    const error = (errors as Record<string, { message?: string }>)?.[field];
    return error?.message;
  };

  const watchedDateOfBirth = String(
    useWatch({ control, name: "dateOfBirth" }) ?? "",
  );

  const validationMessages = useMemo(() => {
    const messages: string[] = [];
    const visited = new WeakSet<object>();

    const collect = (value: unknown) => {
      if (!value || typeof value !== "object") return;

      if (visited.has(value)) return;
      visited.add(value);

      const maybeMessage = (value as Record<string, unknown>).message;
      if (typeof maybeMessage === "string") {
        messages.push(maybeMessage);
      }

      for (const [key, item] of Object.entries(
        value as Record<string, unknown>,
      )) {
        // React Hook Form attaches DOM refs inside errors; they are cyclic and not useful for UI messages.
        if ("ref" === key) {
          continue;
        }

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

  async function submitRegister(reg: RegisterInput, emergencyContact?: string) {
    await registerUser({
      firstname: reg.firstname.trim(),
      lastname: reg.lastname.trim(),
      email: reg.email,
      password: reg.password,
      dateOfBirth: reg.dateOfBirth,
      emergencyContact,
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
      const emergencyContact = serializeEmergencyContact({
        lastname: reg.guardianLastname?.trim() ?? "",
        firstname: reg.guardianFirstname?.trim() ?? "",
        email: reg.guardianEmail?.trim() ?? "",
        phone: reg.guardianPhone?.trim() ?? "",
      });

      try {
        await submitRegister(
          reg,
          emergencyContact ? JSON.stringify(emergencyContact) : undefined,
        );
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
      const currentUser = await getCurrentUser();
      const shouldOpenAdminDashboard =
        currentUser.role === "ROLE_ADMIN" ||
        currentUser.role === "ROLE_SUPER_ADMIN" ||
        currentUser.role === "ROLE_ORGANIZER";

      setStatus({ type: "success", message: "Connexion réussie." });
      reset();
      router.push(shouldOpenAdminDashboard ? "/admin" : "/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de se connecter.";
      setStatus({ type: "error", message });
    }
  }

  const isMinorRegistration =
    mode === "register" &&
    watchedDateOfBirth.length > 0 &&
    !Number.isNaN(Date.parse(watchedDateOfBirth)) &&
    computeAge(watchedDateOfBirth) < 18;

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
                aria-invalid={!!getError("lastname")}
                aria-describedby={
                  getError("lastname") ? "lastname-error" : undefined
                }
              />
              {getError("lastname") && (
                <div
                  id="lastname-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {getError("lastname")}
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
                aria-invalid={!!getError("firstname")}
                aria-describedby={
                  getError("firstname") ? "firstname-error" : undefined
                }
              />
              {getError("firstname") && (
                <div
                  id="firstname-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {getError("firstname")}
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
            aria-invalid={!!getError("email")}
            aria-describedby={getError("email") ? "email-error" : undefined}
          />
          {getError("email") && (
            <div
              id="email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {getError("email")}
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
            aria-invalid={!!getError("password")}
            aria-describedby={
              getError("password") ? "password-error" : undefined
            }
          />
          {getError("password") && (
            <div
              id="password-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {getError("password")}
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
                aria-invalid={!!getError("confirm")}
                aria-describedby={
                  getError("confirm") ? "confirm-error" : undefined
                }
              />
              {getError("confirm") && (
                <div
                  id="confirm-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {getError("confirm")}
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
                aria-invalid={!!getError("dateOfBirth")}
                aria-describedby={
                  getError("dateOfBirth") ? "dateOfBirth-error" : undefined
                }
              />
              {getError("dateOfBirth") && (
                <div
                  id="dateOfBirth-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {getError("dateOfBirth")}
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
                aria-invalid={!!getError("pseudo")}
                aria-describedby={
                  getError("pseudo") ? "pseudo-error" : undefined
                }
              />
              {getError("pseudo") && (
                <div
                  id="pseudo-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {getError("pseudo")}
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
                aria-invalid={!!getError("phone")}
                aria-describedby={getError("phone") ? "phone-error" : undefined}
              />
              {getError("phone") && (
                <div
                  id="phone-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {getError("phone")}
                </div>
              )}
            </div>

            <div className="space-y-4 rounded border border-border p-4">
              <div>
                <p className="text-sm font-medium">Contact d'urgence</p>
                <p className="text-xs text-muted-foreground">
                  {isMinorRegistration
                    ? "Obligatoire pour un mineur."
                    : "Optionnel pour un majeur."}
                </p>
              </div>

              <div>
                <label
                  htmlFor="guardianLastname"
                  className="block text-sm text-muted-foreground"
                >
                  Nom du responsable
                </label>
                <input
                  id="guardianLastname"
                  {...register("guardianLastname")}
                  className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                  autoComplete="family-name"
                  aria-invalid={!!getError("guardianLastname")}
                  aria-describedby={
                    getError("guardianLastname")
                      ? "guardianLastname-error"
                      : undefined
                  }
                />
                {getError("guardianLastname") && (
                  <div
                    id="guardianLastname-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {getError("guardianLastname")}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="guardianFirstname"
                  className="block text-sm text-muted-foreground"
                >
                  Prénom du responsable
                </label>
                <input
                  id="guardianFirstname"
                  {...register("guardianFirstname")}
                  className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                  autoComplete="given-name"
                  aria-invalid={!!getError("guardianFirstname")}
                  aria-describedby={
                    getError("guardianFirstname")
                      ? "guardianFirstname-error"
                      : undefined
                  }
                />
                {getError("guardianFirstname") && (
                  <div
                    id="guardianFirstname-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {getError("guardianFirstname")}
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
                  aria-invalid={!!getError("guardianEmail")}
                  aria-describedby={
                    getError("guardianEmail")
                      ? "guardianEmail-error"
                      : undefined
                  }
                />
                {getError("guardianEmail") && (
                  <div
                    id="guardianEmail-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {getError("guardianEmail")}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="guardianPhone"
                  className="block text-sm text-muted-foreground"
                >
                  Téléphone du responsable
                </label>
                <input
                  id="guardianPhone"
                  {...register("guardianPhone")}
                  className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
                  autoComplete="tel"
                  inputMode="tel"
                  aria-invalid={!!getError("guardianPhone")}
                  aria-describedby={
                    getError("guardianPhone")
                      ? "guardianPhone-error"
                      : undefined
                  }
                />
                {getError("guardianPhone") && (
                  <div
                    id="guardianPhone-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {getError("guardianPhone")}
                  </div>
                )}
              </div>
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
    </div>
  );
}
