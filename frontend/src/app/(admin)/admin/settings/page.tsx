"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getAppSettings,
  updateAppSettings,
  AppSettingsValidationError,
  type AppSetting,
} from "@/lib/settings-api";

type SettingsValues = {
  defaultAddress: string;
  defaultPrice: string;
  defaultMaxPlaces: string;
};

const initialValues: SettingsValues = {
  defaultAddress: "",
  defaultPrice: "",
  defaultMaxPlaces: "",
};

function toFormValues(setting: AppSetting): SettingsValues {
  return {
    defaultAddress: setting.defaultAddress,
    defaultPrice: String(setting.defaultPrice),
    defaultMaxPlaces: String(setting.defaultMaxPlaces),
  };
}

export default function SettingsPage() {
  const [values, setValues] = useState<SettingsValues>(initialValues);
  const [loading, setLoading] = useState(true);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    getAppSettings()
      .then((settings) => {
        if (!active || !settings) {
          return;
        }

        setValues(toFormValues(settings));
        setHasLoadedSettings(true);
      })
      .catch(() => {
        if (active) {
          setError("Impossible de charger les parametres.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    setFormErrors([]);

    const payload = {
      defaultAddress: values.defaultAddress,
      defaultPrice: Number(values.defaultPrice),
      defaultMaxPlaces: Number(values.defaultMaxPlaces),
    };

    try {
      const saved = await updateAppSettings(payload);

      setValues(toFormValues(saved));
      setMessage("Parametres enregistres avec succes.");
    } catch (err) {
      if (err instanceof AppSettingsValidationError) {
        setFormErrors(err.messages);
      } else {
        setFormErrors([
          err instanceof Error
            ? err.message
            : "Impossible d'enregistrer les parametres.",
        ]);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Parametres de l'application</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuration generale</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          {hasLoadedSettings ? (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {formErrors.length > 0 ? (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded border border-destructive/70 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <p className="font-semibold">
                    Veuillez corriger les erreurs suivantes :
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {formErrors.map((formError, index) => (
                      <li key={index}>{formError}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="defaultPrice">
                  PAF par defaut (€)
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="defaultPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.defaultPrice}
                  onChange={(event) =>
                    setValues({ ...values, defaultPrice: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultMaxPlaces">
                  Nombre de joueurs par defaut
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="defaultMaxPlaces"
                  type="number"
                  min="1"
                  value={values.defaultMaxPlaces}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      defaultMaxPlaces: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultAddress">
                  Lieu par defaut
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="defaultAddress"
                  value={values.defaultAddress}
                  onChange={(event) =>
                    setValues({ ...values, defaultAddress: event.target.value })
                  }
                />
              </div>

              <p className="text-xs text-muted-foreground">
                * Champ obligatoire
              </p>

              <Button className="mt-4" type="submit" disabled={saving}>
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
