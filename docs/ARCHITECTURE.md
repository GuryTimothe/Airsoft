# Architecture Technique et Outils

## Vue d'Ensemble

Application web full-stack avec séparation nette entre **backend API** et **frontend web**, déployée via GitHub Actions CI/CD.

```
┌────────────────────────────────────────────────────────────────┐
│                     UTILISATEURS (Navigateur)                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
        ┌────────▼─────────────────┐
        │  FRONTEND (WEB)          │
        │  Next.js 16 / React 19   │
        │  TypeScript 5.0+         │
        │  Port 3000               │
        └────────┬─────────────────┘
                 │
        ┌────────▼──────────────────────────┐
        │   API REST (HTTP/JSON)            │
        │   Symfony 7.4 + API Platform     │
        │   Port 8000                       │
        └────────┬──────────────────────────┘
                 │
        ┌────────▼──────────────────┐
        │   BASE DE DONNÉES         │
        │   PostgreSQL 16-alpine    │
        │   Port 5432               │
        └───────────────────────────┘
```

## Composants Principaux

### 1. Backend - API REST

| Composant | Technologie | Rôle | Version |
|-----------|-------------|------|---------|
| **Framework API** | Symfony | Framework web + routing | 7.4 |
| **API REST** | API Platform | CRUD REST automatisé | 4.3.15 |
| **ORM** | Doctrine | Mapping objet-relationnel | 3.6.7 |
| **BD** | PostgreSQL | Stockage données | 16-alpine |
| **Auth** | JWT (Lexik) | Authentification tokens | 3.2 |
| **Validation** | Symfony Validator | Validation données | Built-in |
| **Sécurité** | Symfony Security | Contrôle accès + Voters | Built-in |
| **Migrations** | Doctrine Migrations | Versionning schéma BD | 3.7 |
| **Langue** | PHP | Langage serveur | 8.4+ |

**Fichiers clés** :
- `src/Entity/` - Modèles de données (User, Game, GameRegistration, etc.)
- `src/Controller/` - Contrôleurs custom (AdminExportController, etc.)
- `src/State/` - Processors/Providers API Platform (business logic)
- `src/Repository/` - Requêtes personnalisées BD
- `config/` - Configuration Symfony
- `migrations/` - Historique changements schéma
- `public/index.php` - Point d'entrée
- `tests/` - Tests PHPUnit

### 2. Frontend - Interface Utilisateur

| Composant | Technologie | Rôle | Version |
|-----------|-------------|------|---------|
| **Framework** | Next.js | Framework React + SSR | 16.2.6 |
| **Langage** | TypeScript | Typage statique | 5.0+ |
| **UI Framework** | React | Composants UI | 19.2.4 |
| **Styling** | Tailwind CSS | Utilitaires CSS | 4.0+ |
| **Components** | shadcn/ui | Composants réutilisables | Latest |
| **Forms** | React Hook Form | Gestion formulaires | 7.76.1 |
| **Validation** | Zod | Validation schémas | 4.4.3 |
| **HTTP Client** | Fetch API | Requêtes HTTP | Built-in |
| **Build Tool** | Webpack | Bundling (via Next.js) | Via Next.js |
| **Package Manager** | npm | Gestion dépendances | 10.0+ |
| **Runtime** | Node.js | Runtime JavaScript | 20+ |

**Fichiers clés** :
- `src/app/` - Pages et layout
- `src/components/` - Composants React
- `src/lib/` - Utilitaires et API clients
- `next.config.ts` - Configuration Next.js
- `tailwind.config.ts` - Configuration Tailwind
- `jest.config.js` - Configuration tests
- `tsconfig.json` - Configuration TypeScript

### 3. Gestion de Versions et CI/CD

| Composant | Outil | Rôle | Configuration |
|-----------|-------|------|---------------|
| **VCS** | Git | Contrôle version code | Branches: main, dev, feature/* |
| **Repository** | GitHub | Hébergement code | https://github.com |
| **Commits** | Conventional Commits | Traçabilité commits | feat:, fix:, chore:, refactor: |
| **CI/CD** | GitHub Actions | Tests, build, deploy automatiques | .github/workflows/ |
| **Release** | release-please | Version automation + changelog | .release-pleaserc.json |

**Workflows** :
- `ci-cd.yml` - Tests/lint sur dev et main
- `release.yml` - Changelog + version bump sur main

### 4. Outils de Build et Compilation

#### Backend
| Outil | Rôle | Commande |
|-------|------|---------|
| **Composer** | Gestionnaire dépendances PHP | `composer install` |
| **Symfony Console** | CLI Symfony | `php bin/console` |
| **Doctrine** | Migrations BD | `php bin/console doctrine:migrations:migrate` |
| **PHP** | Compilation runtime | Natif avec PHP 8.4+ |

#### Frontend
| Outil | Rôle | Commande |
|-------|------|---------|
| **npm** | Gestionnaire dépendances JS | `npm install` |
| **Webpack** | Bundler (via Next.js) | `npm run build` |
| **Next.js** | Build SSR/SSG | `npm run build` |
| **TypeScript** | Compilation TS → JS | `npx tsc --noEmit` |

### 5. Outils de Test et Qualité

| Outil | Type | Framework | Commande | Cible |
|-------|------|-----------|----------|-------|
| **PHPUnit** | Tests unitaires | Backend | `php bin/console test` | `tests/` |
| **Jest** | Tests unitaires | Frontend | `npm test` | `*.test.ts(x)` |
| **PHPStan** | Analyse statique | Backend | `php ./vendor/bin/phpstan analyse src/` | Type checking |
| **ESLint** | Linting | Frontend | `npm run lint` | Code quality |
| **Prettier** | Formatting | Frontend/Config | `npm run format` | Code style |

### 6. Serveurs d'Application

| Serveur | Environnement | Port | Utilisation |
|---------|---------------|------|-------------|
| **PHP Built-in** | Dev local | 8000 | `symfony serve` |
| **Node.js** | Dev local | 3000 | `npm run dev` |
| **PostgreSQL** | Dev local | 5432 | Via compose.yaml (optionnel) |

### 7. Base de Données

| Composant | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| **SGBD** | PostgreSQL | 16-alpine | BD relationnelle |
| **Migrations** | Doctrine Migrations | 3.7+ | Versionning schéma |
| **Connexion** | PDO/Doctrine | Built-in | Accès données |

**Fichiers clés** :
- `migrations/` - Historique migrations
- `.env` / `.env.local` - Config BD
- `compose.yaml` - PostgreSQL optionnel

## Matrice Outils Complète

| Catégorie | Outil | Rôle | Version | Installation |
|-----------|-------|------|---------|--------------|
| **VCS** | Git | Contrôle version | 2.30+ | https://git-scm.com |
| **Repository** | GitHub | Hébergement | Cloud | https://github.com |
| **CI/CD** | GitHub Actions | Automation | Natif | .github/workflows/ |
| **Release** | release-please | Version automation | Latest | .release-pleaserc.json |
| **PM Backend** | Composer | Gestionnaire PHP | 2.5+ | https://getcomposer.org |
| **PM Frontend** | npm | Gestionnaire JS | 9.0+ | Avec Node.js |
| **Runtime Backend** | PHP | Moteur PHP | 8.4+ | https://www.php.net |
| **Runtime Frontend** | Node.js | Moteur JS | 18.0+ | https://nodejs.org |
| **Framework Backend** | Symfony | Framework PHP | 7.4 | Via Composer |
| **API Backend** | API Platform | REST CRUD | 4.3.15 | Via Composer |
| **Framework Frontend** | Next.js | Framework React | 16.2.6 | Via npm |
| **UI Frontend** | React | Lib composants | 19.2.4 | Via npm |
| **Styling** | Tailwind CSS | Utilitaires CSS | 4.0+ | Via npm |
| **BD** | PostgreSQL | SGBD | 16-alpine | Docker ou local |
| **ORM** | Doctrine | Mapping ORM | 3.6.7 | Via Composer |
| **Auth** | JWT Lexik | Authentification | 3.2 | Via Composer |
| **Tests Backend** | PHPUnit | Tests unitaires | Via Composer | Via Composer |
| **Tests Frontend** | Jest | Tests unitaires | 30.4.2 | Via npm |
| **Lint Backend** | PHPStan | Analyse statique | Via Composer | Via Composer |
| **Lint Frontend** | ESLint | Linting | 9.0 | Via npm |
| **Format** | Prettier | Code formatting | 3.0+ | Via npm |
| **Validation** | React Hook Form | Formulaires | 7.76.1 | Via npm |
| **Validation Schema** | Zod | Validation données | 4.4.3 | Via npm |

## Flux de Données

```
1. Utilisateur remplit formulaire (frontend)
   ↓
2. React Hook Form + Zod validation côté client
   ↓
3. Fetch API envoie JSON → Backend
   ↓
4. Symfony Router achemine vers Controller/State Processor
   ↓
5. JWT validation + Voters (contrôle accès)
   ↓
6. API Platform / Controller traite la requête
   ↓
7. Doctrine ORM exécute queries
   ↓
8. PostgreSQL retourne résultats
   ↓
9. Backend sérialise JSON response
   ↓
10. Frontend Fetch reçoit réponse
   ↓
11. React met à jour state
   ↓
12. Composant re-render, affiche résultat utilisateur
```

## Architecture en Couches

```
┌─────────────────────────────────────────┐
│     FRONTEND TIER (port 3000)            │
│  Next.js Pages → Components → Hooks     │
└────────────┬────────────────────────────┘
             │ HTTP REST JSON
┌────────────▼────────────────────────────┐
│     API TIER (port 8000)                 │
│  Symfony Router                         │
│    ├─ Controllers (custom endpoints)    │
│    ├─ API Platform (auto CRUD)          │
│    ├─ State Processors (business)       │
│    └─ Security Voters (authorization)   │
└────────────┬────────────────────────────┘
             │ SQL
┌────────────▼────────────────────────────┐
│  PERSISTENCE TIER (port 5432)           │
│  PostgreSQL                             │
│    ├─ Users table                       │
│    ├─ Games table                       │
│    ├─ GameRegistrations table           │
│    ├─ EmergencyContacts table           │
│    └─ AppSettings table                 │
└─────────────────────────────────────────┘
```

## Rôles d'Accès (RBAC)

| Rôle | Permissions |
|------|------------|
| **ROLE_USER** | Voir parties publiques, s'inscrire, voir ses inscriptions |
| **ROLE_ORGANIZER** | Créer/modifier parties, voir joueurs inscrits, marquer présence |
| **ROLE_ADMIN** | Tous droits, exports CSV, gestion paramètres |
| **ROLE_SUPER_ADMIN** | Tous droits + gestion rôles autres admins |

Implémentation :
- JWT tokens + Symfony Security
- Voters pour authorization fine-grained
- API Platform security declarations

## Infrastructure et Environnements

| Environnement | Données | Accès | Deployment |
|---------------|---------|-------|-----------|
| **Local** | Fixtures | Dev uniquement | `npm run dev` + `symfony serve` |
| **GitHub Actions** | Test DB | CI/CD | Tests automatiques |
| **Production** | Réelles | Utilisateurs | À définir (AWS, Heroku, etc.) |

## Ressources Estimées

| Composant | RAM | Disque | Notes |
|-----------|-----|--------|-------|
| Backend dev (PHP + Symfony) | 150 MB | 400 MB | Sans vendor/ |
| Frontend dev (Node + Next.js) | 300 MB | 800 MB | Sans node_modules/ |
| PostgreSQL | 200 MB | 500 MB | Données test |
| **Total dev** | **650 MB** | **1.7 GB** | Sans dépendances |
| **Total avec deps** | **~1 GB** | **~3 GB** | Avec vendor/ + node_modules/ |

---

## Bonnes Pratiques par Couche

### Backend - Patterns et Conventions

#### 1. Entities (Modèles de Données)

**Localisation** : `src/Entity/`

**Pattern** : Clean Architecture + Doctrine ORM

```php
// Exemple: User.php
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ApiResource(
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']],
    operations: [...]
)]
class User implements UserInterface {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Assert\NotBlank]
    private string $email;

    // Lifecycle callbacks pour invariants métier
    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function updated(): void {
        // Validation avant persistance
    }
}
```

**Conventions** :
- Noms en anglais (PascalCase pour classes, camelCase pour propriétés)
- Doctrine attributes pour ORM + validations
- Serializer groups (`#[Groups(...)]`) pour exposer/cacher champs dans API
- Lifecycle callbacks (`#[ORM\PrePersist]`) pour business logic
- Une Entity = une table principale (pas de jointures complexes dans Entity)

**Tests** : Chaque Entity testée dans `tests/Entity/`

#### 2. DTOs (Data Transfer Objects)

**Localisation** : `src/Dto/`

**Pattern** : Input/Output distinction

```php
// Exemple: RegisterInput.php
class RegisterInput {
    #[ApiProperty]
    #[Groups(['user:write'])]
    #[Assert\NotBlank(message: 'Le prénom est requis.')]
    #[Assert\Length(min: 2, max: 255)]
    public ?string $firstname = null;

    #[ApiProperty]
    #[Assert\Email]
    public ?string $email = null;

    #[Assert\Length(min: 8)]
    public ?string $password = null;
}

class MeUpdateOutput {
    public User $user;
    public string $message;
}
```

**Conventions** :
- Pas d'Entity en input/output (sécurité + flexibilité)
- Validation avec Symfony Validator Constraints
- Serializer Groups pour contrôler exposition
- DTOs immuables (propriétés publiques ou getters)
- Nommage: `{Entity}Input`, `{Entity}Output`, `{Action}Input`, `{Action}Output`

**Tests** : Validations testées via `tests/Dto/` ou intégrées aux State Processor tests

#### 3. State Processors (Business Logic)

**Localisation** : `src/State/`

**Pattern** : API Platform State Pattern

```php
// Exemple: RegisterProcessor
#[implements ProcessorInterface<RegisterInput, User>]
class RegisterProcessor implements ProcessorInterface {
    public function process(
        mixed $data, 
        Operation $operation, 
        array $uriVariables = [], 
        array $context = []
    ): mixed {
        $request = $context['request'];
        $payload = $this->extractPayload($request);
        $input = $this->denormalizer->denormalize($payload, RegisterInput::class, 'json');

        // 1. Validation
        $violations = $this->validator->validate($input);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }

        // 2. Métier
        $user = new User();
        $user->setEmail($input->email);
        $user->setPassword($this->passwordHasher->hashPassword($user, $input->password));
        
        if ($input->dateOfBirth) {
            // Gestion contact urgence mineurs
            $emergencyContact = new EmergencyContact(...);
            $user->setEmergencyContact($emergencyContact);
        }

        // 3. Persistance
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }
}
```

**Conventions** :
- Un Processor par opération métier (Create, Update, Password Change, etc.)
- Responsabilité unique : validation → transformation → persistance
- Injection de dépendances (EntityManager, Validators, Hashers)
- Throw exceptions métier (ConflictHttpException, BadRequestHttpException)
- Tests : 100% coverage requis (happy path + erreurs)

**Autres Processors** :
- `RegisterProcessor` — Création compte public
- `UserCreateProcessor` — Création utilisateur par admin
- `MeUpdateProcessor` — Modification profil perso
- `MeEmailUpdateProcessor` — Changement email
- `MePasswordUpdateProcessor` — Changement mot de passe
- `GameRegistrationCreateProcessor` — Inscription à partie
- `GameRegistrationPresenceProcessor` — Marquer présence

#### 4. Voters (Autorisation Fine-Grained)

**Localisation** : `src/Security/Voter/`

**Pattern** : Symfony Security Voters

```php
// Exemple: GameVoter
#[AsVoter(priority: 250)]
class GameVoter extends Voter {
    protected function supports(string $attribute, mixed $subject): bool {
        return in_array($attribute, ['VIEW_GAME', 'CREATE_GAME', 'UPDATE_GAME', 'DELETE_GAME'])
            && ($subject instanceof Game || $attribute === 'LIST_GAMES');
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        return match($attribute) {
            'VIEW_GAME' => $this->canViewGame($subject, $user),
            'CREATE_GAME' => in_array('ROLE_ADMIN', $user->getRoles()),
            'UPDATE_GAME' => in_array('ROLE_ADMIN', $user->getRoles()),
            'DELETE_GAME' => in_array('ROLE_ADMIN', $user->getRoles()),
            default => false,
        };
    }

    private function canViewGame(Game $game, User $user): bool {
        // Public games : everyone
        if ($game->isPublic()) {
            return true;
        }
        // Private games : admin ou user avec accès
        return in_array('ROLE_ADMIN', $user->getRoles()) 
            || $user->canSeePrivate();
    }
}
```

**Conventions** :
- Un Voter par Entity principale (User, Game, GameRegistration, AppSetting)
- Attributs constants (noms lisibles: `VIEW_`, `CREATE_`, `DELETE_`, etc.)
- Match expression pour logique propre
- Tests : 100% coverage sur chaque scénario (admin, user, owner, denied)

**Voters implémentés** :
- `UserVoter` — Gestion utilisateurs
- `GameVoter` — Accès parties
- `GameRegistrationVoter` — Inscriptions aux parties
- `AppSettingVoter` — Paramètres application

#### 5. Repositories (Requêtes Complexes)

**Localisation** : `src/Repository/`

**Pattern** : ServiceEntityRepository de Doctrine

```php
// Exemple: GameRepository
#[RepositoryClass(GameRepository::class)]
class GameRepository extends ServiceEntityRepository {
    public function __construct(ManagerRegistry $registry) {
        parent::__construct($registry, Game::class);
    }

    // Requête nommée explicite
    public function findForExport(
        ?\DateTimeImmutable $dateFrom = null,
        ?\DateTimeImmutable $dateTo = null,
    ): array {
        $queryBuilder = $this->createQueryBuilder('game')
            ->orderBy('game.startDateTime', 'ASC');

        if (null !== $dateFrom) {
            $queryBuilder
                ->andWhere('game.startDateTime >= :dateFrom')
                ->setParameter('dateFrom', $dateFrom, Types::DATETIME_IMMUTABLE);
        }

        return $queryBuilder->getQuery()->getResult();
    }
}
```

**Conventions** :
- Jamais de raw SQL (toujours QueryBuilder)
- Noms de méthodes descriptifs : `findByXxx`, `findAllActive`, `findForExport`
- Parameterized queries (protection SQL injection)
- Return type hints (`@return list<Game>`, `?User`)
- Tests : Pas systématiquement testé (Doctrine testée par fournisseur)

---

### Frontend - Patterns et Conventions

#### 1. Components (Réutilisabilité)

**Localisation** : `src/components/`

**Pattern** : React Server/Client Components

```typescript
// Composant server (RSC) : layout + logique fetch
// Fichier: app/dashboard/page.tsx
export default async function DashboardPage() {
  const games = await fetchGames();
  return <DashboardClient games={games} />;
}

// Composant client : "use client" + interactivité
// Fichier: components/DashboardClient.tsx
'use client';
import { useState } from 'react';

export function DashboardClient({ games }: { games: Game[] }) {
  const [filter, setFilter] = useState('');
  return (
    <div>
      <input onChange={(e) => setFilter(e.target.value)} />
      <GameList games={games.filter(...)} />
    </div>
  );
}

// Composant UI réutilisable
// Fichier: components/ui/Button.tsx
export function Button({ children, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 font-medium rounded',
        variant === 'default' && 'bg-blue-500 text-white',
        variant === 'outline' && 'border border-gray-300',
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Conventions** :
- Server Components par défaut (fetch, db)
- `'use client'` seulement si interactivité/hooks
- Props typées (TypeScript strict)
- Tailwind classes (via `cn()` helper pour fusion)
- shadcn/ui pour composants complexes (Dialog, Select, etc.)
- 100% accessibility (aria-labels, focus management)

#### 2. Hooks et Logique (Réutilisabilité)

**Localisation** : `src/lib/`

**Pattern** : Custom Hooks + API Clients

```typescript
// Exemple: useGames() custom hook
export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const data = await fetchGames();
        setGames(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  return { games, loading, error };
}

// Exemple: API client
export async function fetchGames(): Promise<Game[]> {
  const response = await fetch(`${API_URL}/api/games`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch games');
  }
  return response.json();
}
```

**Conventions** :
- Hooks encapsulent fetch logic
- Error handling systématique
- Loading states gérés
- Pas de console.log en prod (debug console en dev)
- Tests : Hook tests via @testing-library/react

#### 3. Formulaires (React Hook Form + Zod)

**Localisation** : `src/app/`, `src/components/`

**Pattern** : Validation schéma + formulaire réactif

```typescript
// Définition schéma
const registerSchema = z.object({
  firstname: z.string().min(2),
  email: z.string().email(),
  dateOfBirth: z.date(),
  emergencyContact: z.object({...}).optional().refine(...)
});

// Composant formulaire
export function RegisterForm() {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {},
  });

  const onSubmit = async (data) => {
    try {
      await createUser(data);
      router.push('/dashboard');
    } catch (err) {
      form.setError('root', { message: 'Registration failed' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <label htmlFor="firstname">First Name</label>
      <input {...form.register('firstname')} id="firstname" />
      {form.formState.errors.firstname && (
        <span className="text-red-500">{form.formState.errors.firstname.message}</span>
      )}
      <button type="submit" disabled={form.formState.isSubmitting}>
        Register
      </button>
    </form>
  );
}
```

**Conventions** :
- Zod schemas en TypeScript (type-safe)
- React Hook Form pour gestion state
- Validation client + serveur
- Error messages user-friendly
- Accessible form labels + aria-invalid

#### 4. Tests (Jest + React Testing Library)

**Localisation** : `src/**/*.test.ts(x)`

**Pattern** : Unit + Component Tests

```typescript
describe('RegisterForm', () => {
  it('should register user on valid submission', async () => {
    const { getByLabelText, getByRole } = render(<RegisterForm />);
    const firstnameInput = getByLabelText('First Name');
    
    await user.type(firstnameInput, 'John');
    await user.click(getByRole('button', { name: /register/i }));
    
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ firstname: 'John' })
    );
  });

  it('should display error on failed registration', async () => {
    mockCreateUser.mockRejectedValueOnce(new Error('Server error'));
    
    const { getByRole, getByText } = render(<RegisterForm />);
    await user.click(getByRole('button', { name: /register/i }));
    
    expect(getByText('Registration failed')).toBeInTheDocument();
  });
});
```

**Conventions** :
- Test user interactions (not internal state)
- Mock API calls
- Error paths couvertes
- Accessibility tests (aria-labels, roles)
- 70%+ code coverage requis

---

## Patterns Transversaux

### Gestion d'Erreurs

**Backend** :
```php
// Exceptions métier jettent HTTP exceptions
throw new ConflictHttpException('Game is full');
throw new AccessDeniedHttpException('Not authorized');
// Symfony les converti en HTTP responses
```

**Frontend** :
```typescript
// Erreurs catchées et affichées user-friendly
try {
  await createUser(data);
} catch (err) {
  const message = parseApiErrorMessage(err);
  setError(message); // Affiche à l'utilisateur
}
```

### Validation

**Backend** : Symfony Validator Constraints dans Entities + DTOs
**Frontend** : Zod schemas + React Hook Form

Les deux côtés valident (ne pas faire confiance au client).

### Sécurité

- **Auth** : JWT Bearer token (localStorage + HttpOnly cookie)
- **Autorisation** : Voters backend (jamais de contrôle client uniquement)
- **CSRF** : Next.js gère automatiquement (fetch API)
- **XSS** : React échappe par défaut, Tailwind classe pas de dangerouslySetInnerHTML
