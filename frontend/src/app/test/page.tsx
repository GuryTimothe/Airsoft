'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function UIPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">UI System Lab</h1>
        <p className="text-muted-foreground">
          Test des couleurs métier + shadcn theme militaire
        </p>
      </div>

      {/* PRIMARY / SECONDARY */}
      <section className="grid md:grid-cols-3 gap-4">

        <Card>
          <CardHeader>
            <CardTitle>Primary (terre de France)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-12 rounded-md bg-primary" />
            <p className="mt-2 text-sm text-muted-foreground">
              #7C6D66
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Secondary (vert olive)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-12 rounded-md bg-secondary" />
            <p className="mt-2 text-sm text-muted-foreground">
              #949c81
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accent (terrain)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-12 rounded-md bg-accent" />
            <p className="mt-2 text-sm text-muted-foreground">
              brown tactical
            </p>
          </CardContent>
        </Card>

      </section>

      {/* SEMANTIC COLORS */}
      <section className="grid md:grid-cols-4 gap-4">

        <Card>
          <CardHeader><CardTitle>Success</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="h-10 rounded bg-success" />
            <Badge className="bg-success text-white">SUCCESS</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="h-10 rounded bg-info" />
            <Badge className="bg-info text-white">INFO</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Warning</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="h-10 rounded bg-warning" />
            <Badge className="bg-warning text-black">WARNING</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Error</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="h-10 rounded bg-destructive" />
            <Badge className="bg-destructive text-white">ERROR</Badge>
          </CardContent>
        </Card>

      </section>

      {/* BUTTONS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>

        <div className="flex flex-wrap gap-3">

          <Button>Primary</Button>

          <Button variant="secondary">Secondary</Button>

          <Button variant="outline">Outline</Button>

          <Button variant="ghost">Ghost</Button>

          <Button variant="destructive">Destructive</Button>

        </div>
      </section>

      {/* STATUS BUTTONS (IMPORTANT POUR TON APP) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Status system (métier)</h2>

        <div className="flex flex-wrap gap-3">

          <Button className="bg-success text-white hover:bg-success/90">
            Success action
          </Button>

          <Button className="bg-info text-white hover:bg-info/90">
            Info action
          </Button>

          <Button className="bg-warning text-black hover:bg-warning/90">
            Warning action
          </Button>

          <Button className="bg-destructive text-white hover:bg-destructive/90">
            Error action
          </Button>

        </div>
      </section>

      {/* CARDS */}
      <section className="grid md:grid-cols-3 gap-4">

        <Card>
          <CardHeader>
            <CardTitle>Party OK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Inscription active
            </p>
            <Badge className="mt-3 bg-success text-white">
              ACTIVE
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Full Party</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Liste d'attente activée
            </p>
            <Badge className="mt-3 bg-warning text-black">
              FULL
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blocked User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Accès refusé
            </p>
            <Badge className="mt-3 bg-destructive text-white">
              BANNED
            </Badge>
          </CardContent>
        </Card>

      </section>

    </div>
  )
}