export default function CGU() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 leading-relaxed">
      <header>
        <h1 className="text-3xl font-bold">
          Conditions Générales d’Utilisation
        </h1>
        <p className="text-muted-foreground">
          Dernière mise à jour : 29 juin 2026
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Objet</h2>
        <p>
          Les présentes CGU définissent les règles d’utilisation du site et des
          services proposés.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Accès au service</h2>
        <p>
          Le site est accessible gratuitement, sauf indication contraire.
          Certains services peuvent nécessiter une création de compte.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Compte utilisateur</h2>
        <p>
          Lors de l’inscription (email ou Google OAuth), l’utilisateur s’engage
          à fournir des informations exactes. Il est responsable de la
          confidentialité de son compte.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Comportement</h2>
        <p>
          L’utilisateur s’engage à ne pas utiliser le service à des fins
          frauduleuses, illégales ou nuisibles.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Résiliation</h2>
        <p>
          L’éditeur se réserve le droit de suspendre ou supprimer un compte en
          cas de non-respect des CGU.
        </p>
      </section>
    </main>
  );
}
