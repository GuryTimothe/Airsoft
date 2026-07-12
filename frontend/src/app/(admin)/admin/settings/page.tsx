"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getAppSettings,
  updateAppSettings,
  type AppSetting,
} from "@/lib/settings-api";

type SettingsValues = {
  defaultAddress: string;
  defaultPrice: string;
  defaultMaxPlaces: string;
};

const defaultValues: SettingsValues = {
  defaultAddress: "Terrain principal",
  defaultPrice: "10",
  defaultMaxPlaces: "24",
};

function toFormValues(setting: AppSetting): SettingsValues {
  return {
    defaultAddress: setting.defaultAddress,
    defaultPrice: String(setting.defaultPrice),
    defaultMaxPlaces: String(setting.defaultMaxPlaces),
  };
}

export default function SettingsPage() {
  const [values, setValues] = useState<SettingsValues>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAppSettings()
      .then((settings) => {
        if (!active || !settings) {
          return;
        }

        setValues(toFormValues(settings));
      })
      .catch(() => {
        if (active) {
          setError(
            "Impossible de charger les parametres, valeurs locales utilisees.",
          );
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
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer les parametres.",
      );
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="defaultPrice">PAF par defaut (€)</Label>
              <Input
                id="defaultPrice"
                type="number"
                min="0"
                step="0.01"
                value={values.defaultPrice}
                onChange={(event) =>
                  setValues({ ...values, defaultPrice: event.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMaxPlaces">
                Nombre de joueurs par defaut
              </Label>
              <Input
                id="defaultMaxPlaces"
                type="number"
                min="1"
                value={values.defaultMaxPlaces}
                onChange={(event) =>
                  setValues({ ...values, defaultMaxPlaces: event.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultAddress">Lieu par defaut</Label>
              <Input
                id="defaultAddress"
                value={values.defaultAddress}
                onChange={(event) =>
                  setValues({ ...values, defaultAddress: event.target.value })
                }
                required
              />
            </div>

            <Button className="mt-4" type="submit" disabled={saving}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
