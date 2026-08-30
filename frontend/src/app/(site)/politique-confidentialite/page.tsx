export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 leading-relaxed">
      <header>
        <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
        <p className="text-muted-foreground">
          RGPD – Protection des données personnelles
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Données collectées</h2>
        <p>
          Nous collectons uniquement les données nécessaires au fonctionnement
          du service : email, nom, prénom, âge, téléphone. Les informations d'un
          contact d'urgence peuvent également être collectés.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Utilisation des données</h2>
        <p>
          Les données sont utilisées pour : créer un compte, authentifier
          l’utilisateur et personnaliser l’expérience.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Stockage</h2>
        <p>
          Les données sont stockées de manière sécurisée dans une base de
          données.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Partage des données</h2>
        <p>
          Les données ne sont jamais vendues. Elles peuvent être transmises
          uniquement aux services nécessaires au fonctionnement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Durée de conservation</h2>
        <p>
          Les données sont conservées tant que le compte utilisateur est actif.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Droits de l’utilisateur</h2>
        <p>
          Conformément au RGPD, vous disposez des droits : accès, rectification,
          suppression, opposition.
        </p>

        <p>Contact : muret.airsoft@gmail.com</p>
      </section>
    </main>
  );
}
