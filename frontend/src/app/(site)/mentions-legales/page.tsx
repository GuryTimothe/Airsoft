export default function MentionsLegales() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-10 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Mentions légales</h1>
        <p className="text-muted-foreground">
          Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance
          dans l’économie numérique.
        </p>
      </header>

      {/* ÉDITEUR */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Éditeur du site</h2>
        <p>
          Nom du site : <strong>Muret Airsoft</strong>
          <br />
          Responsable de publication : Nathan Tharsis
          <br />
          Email : muret.airsoft@gmail.com
          <br />
          Adresse : Chemin de la hilière, 31600 Muret, France
        </p>
      </section>

      {/* HÉBERGEMENT */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Hébergement</h2>
        <p>
          Hébergeur : Hexalab
          <br />
          Site web : https://airsoft.fywolf.org/
          <br />
          Adresse : 6 rue des Lilas, 44000 Nantes, France
        </p>
      </section>

      {/* PROPRIÉTÉ INTELLECTUELLE */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Propriété intellectuelle</h2>
        <p>
          L’ensemble du contenu du site (textes, images, logos, code) est
          protégé par le droit d’auteur. Toute reproduction, distribution ou
          modification sans autorisation est interdite.
        </p>
      </section>

      {/* DONNÉES PERSONNELLES */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Données personnelles</h2>
        <p>
          Les données collectées via le site sont utilisées uniquement dans le
          cadre du service proposé. Conformément au RGPD, vous disposez d’un
          droit d’accès, de rectification et de suppression de vos données.
        </p>

        <p>
          Pour exercer ces droits : <strong>muret.airsoft@gmail.com</strong>
        </p>
      </section>

      {/* COOKIES */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Cookies</h2>
        <p>
          Le site peut utiliser des cookies à des fins de fonctionnement et de
          mesure d’audience. Vous pouvez les refuser via les paramètres de votre
          navigateur.
        </p>
      </section>

      {/* LIMITATION */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Limitation de responsabilité</h2>
        <p>
          L’éditeur du site ne peut être tenu responsable des dommages directs
          ou indirects causés lors de l’utilisation du site.
        </p>
      </section>
    </main>
  );
}
