"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthToken, setAuthToken } from "@/lib/auth";
import {
  getCurrentUser,
  updateMyEmail,
  updateMyPassword,
  updateMyProfile,
  type User,
} from "@/lib/user-api";

function displayOptionalValue(value?: string | null): string {
  if (typeof value !== "string") {
    return "Aucun";
  }

  return value.trim() ? value : "Aucun";
}

type DismissibleMessageProps = {
  message: string;
  onClose: () => void;
};

function DismissibleMessage({ message, onClose }: DismissibleMessageProps) {
  return (
    <div className="relative mt-4 rounded-md border border-emerald-600/40 bg-emerald-600/10 p-3 pr-11 text-sm text-emerald-700">
      {message}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le message"
        className="absolute right-2 top-2 rounded p-1 text-emerald-700/80 transition hover:bg-emerald-600/15 hover:text-emerald-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProfileContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isUpdatingGeneral, setIsUpdatingGeneral] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [generalForm, setGeneralForm] = useState({
    firstname: "",
    lastname: "",
    dateOfBirth: "",
    pseudo: "",
    phone: "",
  });
  const [emailForm, setEmailForm] = useState({
    email: "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isDisposed = false;

    async function loadProfile() {
      if (!getAuthToken()) {
        router.replace("/auth/login");
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (!isDisposed) {
          setUser(currentUser);
          setGeneralForm({
            firstname: currentUser.firstname,
            lastname: currentUser.lastname,
            dateOfBirth: currentUser.dateOfBirth.slice(0, 10),
            pseudo: currentUser.pseudo ?? "",
            phone: currentUser.phone ?? "",
          });
          setEmailForm({ email: currentUser.email, currentPassword: "" });
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setErrorMessage(null);
        }
      } catch {
        if (!isDisposed) {
          setErrorMessage("Impossible de charger votre profil.");
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isDisposed = true;
    };
  }, [router]);

  useEffect(() => {
    if (!generalMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGeneralMessage(null);
    }, 30000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [generalMessage]);

  useEffect(() => {
    if (!emailMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEmailMessage(null);
    }, 30000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [emailMessage]);

  useEffect(() => {
    if (!passwordMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPasswordMessage(null);
    }, 30000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [passwordMessage]);

  async function handleGeneralSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralMessage(null);
    setGeneralError(null);
    setIsUpdatingGeneral(true);

    try {
      const updatedUser = await updateMyProfile({
        firstname: generalForm.firstname,
        lastname: generalForm.lastname,
        dateOfBirth: generalForm.dateOfBirth,
        pseudo: generalForm.pseudo.trim() ? generalForm.pseudo : null,
        phone: generalForm.phone.trim() ? generalForm.phone : null,
      });

      setUser(updatedUser);
      setGeneralForm({
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        dateOfBirth: updatedUser.dateOfBirth.slice(0, 10),
        pseudo: updatedUser.pseudo ?? "",
        phone: updatedUser.phone ?? "",
      });
      setGeneralMessage("Profil mis a jour.");
      setIsGeneralModalOpen(false);
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "Impossible de mettre a jour le profil.",
      );
    } finally {
      setIsUpdatingGeneral(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailMessage(null);
    setEmailError(null);

    if (!emailForm.currentPassword.trim()) {
      setEmailError("Le mot de passe actuel est requis.");
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const result = await updateMyEmail({
        email: emailForm.email,
        currentPassword: emailForm.currentPassword,
      });

      setAuthToken(result.token);
      setUser(result.user);
      setEmailForm({
        email: result.user.email,
        currentPassword: "",
      });
      setEmailMessage("Email mis a jour.");
      setIsEmailModalOpen(false);
    } catch (error) {
      setEmailError(
        error instanceof Error
          ? error.message
          : "Impossible de mettre a jour l'email.",
      );
    } finally {
      setIsUpdatingEmail(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError("Le mot de passe actuel est requis.");
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      setPasswordError("Le nouveau mot de passe est requis.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(
        "La confirmation ne correspond pas au nouveau mot de passe.",
      );
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const result = await updateMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setAuthToken(result.token);
      setUser(result.user);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("Mot de passe mis a jour.");
      setIsPasswordModalOpen(false);
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Impossible de mettre a jour le mot de passe.",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Chargement du profil...</p>
      </main>
    );
  }

  if (errorMessage || !user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="rounded-md border border-destructive/60 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage ?? "Profil introuvable."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          Retrouvez ici vos informations de compte.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Prénom
            </dt>
            <dd className="text-base font-medium">{user.firstname}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Nom
            </dt>
            <dd className="text-base font-medium">{user.lastname}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Email
            </dt>
            <dd className="text-base font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Pseudo
            </dt>
            <dd className="text-base font-medium">
              {displayOptionalValue(user.pseudo)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Téléphone
            </dt>
            <dd className="text-base font-medium">
              {displayOptionalValue(user.phone)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Modifier mon profil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez l'action a effectuer. Chaque bouton ouvre une fenetre de
          modification.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => {
              setGeneralError(null);
              setIsGeneralModalOpen(true);
            }}
          >
            Modifier infos
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEmailError(null);
              setEmailForm({ ...emailForm, currentPassword: "" });
              setIsEmailModalOpen(true);
            }}
          >
            Modifier email
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPasswordError(null);
              setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setIsPasswordModalOpen(true);
            }}
          >
            Modifier mot de passe
          </Button>
        </div>

        {generalMessage ? (
          <DismissibleMessage
            message={generalMessage}
            onClose={() => setGeneralMessage(null)}
          />
        ) : null}
        {emailMessage ? (
          <DismissibleMessage
            message={emailMessage}
            onClose={() => setEmailMessage(null)}
          />
        ) : null}
        {passwordMessage ? (
          <DismissibleMessage
            message={passwordMessage}
            onClose={() => setPasswordMessage(null)}
          />
        ) : null}
      </section>

      <Dialog open={isGeneralModalOpen} onOpenChange={setIsGeneralModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier mes infos</DialogTitle>
            <DialogDescription>
              Vous pouvez modifier vos informations generales sans mot de passe.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleGeneralSubmit}>
            {generalError ? (
              <p className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {generalError}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-firstname">Prenom</Label>
                <Input
                  id="profile-firstname"
                  value={generalForm.firstname}
                  onChange={(event) =>
                    setGeneralForm({
                      ...generalForm,
                      firstname: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-lastname">Nom</Label>
                <Input
                  id="profile-lastname"
                  value={generalForm.lastname}
                  onChange={(event) =>
                    setGeneralForm({
                      ...generalForm,
                      lastname: event.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="profile-dob">Date de naissance</Label>
                <Input
                  id="profile-dob"
                  type="date"
                  value={generalForm.dateOfBirth}
                  onChange={(event) =>
                    setGeneralForm({
                      ...generalForm,
                      dateOfBirth: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-pseudo">Pseudo</Label>
                <Input
                  id="profile-pseudo"
                  value={generalForm.pseudo}
                  onChange={(event) =>
                    setGeneralForm({
                      ...generalForm,
                      pseudo: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Telephone</Label>
                <Input
                  id="profile-phone"
                  value={generalForm.phone}
                  onChange={(event) =>
                    setGeneralForm({
                      ...generalForm,
                      phone: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdatingGeneral}>
                {isUpdatingGeneral ? "Mise a jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier mon email</DialogTitle>
            <DialogDescription>
              La validation exige votre mot de passe actuel.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            {emailError ? (
              <p className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {emailError}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="profile-email">Nouvel email</Label>
              <Input
                id="profile-email"
                type="email"
                value={emailForm.email}
                onChange={(event) =>
                  setEmailForm({ ...emailForm, email: event.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email-current-password">
                Mot de passe actuel
              </Label>
              <Input
                id="profile-email-current-password"
                type="password"
                value={emailForm.currentPassword}
                onChange={(event) =>
                  setEmailForm({
                    ...emailForm,
                    currentPassword: event.target.value,
                  })
                }
                required
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdatingEmail}>
                {isUpdatingEmail ? "Mise a jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier mon mot de passe</DialogTitle>
            <DialogDescription>
              Renseignez le mot de passe actuel puis votre nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            {passwordError ? (
              <p className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {passwordError}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="profile-password-current">
                Mot de passe actuel
              </Label>
              <Input
                id="profile-password-current"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: event.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-password-new">Nouveau mot de passe</Label>
              <Input
                id="profile-password-new"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: event.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-password-confirm">Confirmation</Label>
              <Input
                id="profile-password-confirm"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: event.target.value,
                  })
                }
                required
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? "Mise a jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
