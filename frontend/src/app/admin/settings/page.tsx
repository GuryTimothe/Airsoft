import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Paramètres de l’application</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuration générale</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* AGE MINIMUM */}
          <div className="space-y-2">
            <Label>Âge minimum</Label>
            <Input type="number" defaultValue={16} />
          </div>

          {/* PAF DEFAULT */}
          <div className="space-y-2">
            <Label>PAF par défaut (€)</Label>
            <Input type="number" defaultValue={10} />
          </div>

          {/* MAX PLAYERS */}
          <div className="space-y-2">
            <Label>Nombre de joueurs par défaut</Label>
            <Input type="number" defaultValue={24} />
          </div>

          {/* LOCATION */}
          <div className="space-y-2">
            <Label>Lieu par défaut</Label>
            <Input defaultValue="Terrain principal" />
          </div>

          <Button className="mt-4">Sauvegarder</Button>
        </CardContent>
      </Card>
    </main>
  );
}
