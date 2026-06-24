import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const lastParty = {
  title: "CQB Night Session",
  date: "2026-06-12",
  players: 24,
  pafTotal: 240,
};

export default function AdminDashboard() {
  return (
    <main className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* STATS QUICK VIEW */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Parties ce mois</p>
            <p className="text-2xl font-bold">6</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Joueurs actifs</p>
            <p className="text-2xl font-bold">128</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">CA estimé</p>
            <p className="text-2xl font-bold">1 240€</p>
          </CardContent>
        </Card>
      </div>

      {/* DERNIÈRE PARTIE */}
      <Card>
        <CardHeader>
          <CardTitle>Dernière partie</CardTitle>
        </CardHeader>

        <CardContent className="space-y-1 text-sm">
          <p>🎯 {lastParty.title}</p>
          <p>📅 {lastParty.date}</p>
          <p>👥 {lastParty.players} joueurs</p>
          <p>💸 Gain PAF : {lastParty.pafTotal}€</p>

          <Button className="mt-3">Voir détails</Button>
        </CardContent>
      </Card>
    </main>
  );
}
