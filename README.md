# Client — Health Hub Pro (React + Vite)

Ce README documente entièrement le client React : installation, structure, conventions, composants clés, tests et dépannage. Rédigé en français pour les contributeurs du projet.

1) Aperçu rapide
- Stack : Vite + React + TypeScript, TanStack Router, React Query, Zustand, Tailwind/shadcn.
- Contrat API : le client appelle l'API backend (préfixe `/api/v1`) ; la variable d'environnement attendue est `VITE_API_URL` (voir `client/.env.example`).

2) Prérequis
- Node.js >= 18 (recommandé 20)
- Yarn / npm / bun (le projet contient des scripts pour npm et bun)
- PostgreSQL + Redis pour le backend (si vous exécutez l'ensemble localement)

3) Installation locale
```bash
git clone <repo>
cd client
npm install
cp .env.example .env
# modifier VITE_API_URL vers votre backend local, ex: http://localhost:5000/api/v1
```

4) Commandes utiles
- Développement : `npm run dev`
- Build production : `npm run build`
- Preview build : `npm run preview`
- Tests : `npm run test` (vitest)
- Lint : `npm run lint` (si présent)

5) Variables d'environnement
- `VITE_API_URL` — URL complète de l'API backend (ex: `http://localhost:5000/api/v1`).
- D'autres variables peuvent être présentes dans `client/.env.example` ou dans le portail Vite.

6) Structure du code (points d'entrée)
- `src/routes/` — pages et routing (TanStack Router). Chaque fichier sous `routes` correspond à une route.
- `src/components/` — composants UI réutilisables et pages partielles.
  - `components/booking/booking-panel.tsx` : interface de réservation (sélection date/créneau, saisie carte, confirmation).
- `src/hooks/api/` — hooks React Query (ex: `use-appointments.ts`) utilisés par les pages.
- `src/services/` — wrappers HTTP pour l'API (ex: `appointments.service.ts`).
- `src/stores/` — état global (auth, ui), basé sur Zustand.
- `src/types/` — types partagés et DTO côté client (garder synchronisé avec le backend).

7) Flux réservation — résumé technique
1. L'utilisateur sélectionne un médecin et un créneau via `find-doctor`.
2. `BookingPanel` construit le payload `CreateAppointmentDto` puis appelle `appointmentsService.create()`.
3. Le client fournit les champs de paiement (simulés en dev) : `cardNumber` (string), `expMonth` (number), `expYear` (number), `cvc` (string), `cardHolderName` (optionnel).
4. Le backend traite la demande, simule le paiement et retourne l'objet `Appointment` (avec `invoice` si payé).

8) Composants & fichiers clés à connaître
- `client/src/components/booking/booking-panel.tsx` — UX de réservation, validation des cartes, indicateurs d'étapes.
- `client/src/hooks/api/use-appointments.ts` — hooks pour mutation/query d'appointments.
- `client/src/services/appointments.service.ts` — wrapper HTTP, point central pour adapter le format de payload.
- `client/src/types/appointment.types.ts` — types DTO : mettez à jour si le backend évolue.

9) Tests
- Unit tests : `npm run test`. Les tests sont configurés avec `vitest` (voir `vitest.config.ts`).
- Rendre les hooks testables en mockant `appointments.service` ou en utilisant `msw` pour simuler l'API.

10) Lint / Format
- Utilisez `npm run lint` et `npm run format` (si présents). Respectez les règles ESLint/Prettier du projet.

11) Debug & dépannage
- Erreur `Payment failed: Invalid card number` : utiliser une carte test Luhn valide `4242424242424242` et s'assurer que `expMonth` / `expYear` sont envoyés comme `number`.
- Si le client ne trouve pas l'API : vérifier `VITE_API_URL` et que le backend est démarré.
- Console SSR / Vite : regarder `client/.output/server` pour traces côté serveur (rendering).

12) Ajouter une nouvelle page / route
1. Créer `src/routes/<your>.tsx` suivant la convention TanStack Start.
2. Ajouter l'export `Route` si nécessaire et reconstruire le routeTree (`routeTree.gen.ts` est généré).
3. Ajouter tests pour la nouvelle page et les hooks associés.

13) Conventions et bonnes pratiques
- Types : centraliser DTOs dans `src/types` et garder la parité avec backend DTOs.
- Hooks : mutations/queries dans `src/hooks/api`, une seule responsabilité par hook.
- UI : composants purs dans `src/components/ui`, logique métier dans `src/components/booking` ou `routes`.

14) Contribution
- Fork & PR : créer des branches descriptives `feat/...` / `fix/...`.
- Avant PR : lancer `npm run lint`, `npm run test`, vérifier build.

15) Ressources supplémentaires
- Endpoint API & Swagger : démarrer backend et ouvrir `/api-docs`.
- Pour l'intégration paiement en prod : prévoir un provider (Stripe, Adyen) et extraire la logique de paiement hors du backend de dev.

Contact
- Besoin d'aide sur une intégration frontend/backend ou tests ? Ouvrez une issue avec reproduction et logs.

# 🏥 Health Hub Pro — MediCare

Plateforme médicale de prise de rendez-vous **en présentiel**, avec
dashboards dédiés patients, médecins et administrateurs.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

> ⚠️ Projet en développement actif — voir [ROADMAP.md](./ROADMAP.md) pour
> l'état d'avancement détaillé par fonctionnalité.

---

## Sommaire

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture du dépôt](#architecture-du-dépôt)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Lancer le projet](#lancer-le-projet)
- [Documentation API](#documentation-api)
- [Tests](#tests)
- [Roadmap](#roadmap)
- [Licence](#licence)

## Aperçu

Health Hub Pro connecte patients et médecins pour la prise de rendez-vous
**exclusivement en présentiel** (choix de conception assumé — pas de
téléconsultation dans le périmètre actuel). L'application couvre le
parcours complet : recherche de médecin, réservation de créneau, suivi des
rendez-vous, facturation, dossier santé (médicaments, constantes), avis, et
des dashboards dédiés selon le rôle connecté (`PATIENT`, `DOCTOR`, `ADMIN`).

## Fonctionnalités

### Authentification & sécurité
- Inscription patient/médecin, connexion, refresh token en rotation
- Vérification d'email, réinitialisation de mot de passe
- Contrôle d'accès par rôle (RBAC) et par permissions fines
- Verrouillage anti brute-force, piste d'audit

### Espace patient
- Recherche de médecin par spécialité, ville, disponibilité
- Réservation de créneau en présentiel avec récapitulatif
- Suivi des rendez-vous (à venir / historique), annulation
- Facturation, dossier santé (médicaments, constantes), avis

### Espace médecin
- Agenda et traitement des rendez-vous (terminé / absent / annulé)
- Gestion des créneaux de disponibilité
- Fiches de ses patients, avis reçus, factures, profil public

### Espace administrateur *(version actuelle réduite — voir roadmap)*
- Supervision de tous les rendez-vous de la plateforme
- Gestion des factures (marquage payé)
- Consultation des fiches patients

## Stack technique

**Frontend** (`client/`)
- [TanStack Start](https://tanstack.com/start) + React + TypeScript
- TanStack Router (routing fichiers) + TanStack Query (état serveur)
- Zustand (état d'authentification)
- Tailwind CSS + shadcn/ui
- Axios

**Backend** (`backend/`)
- [NestJS](https://nestjs.com/) + TypeScript
- [Prisma ORM](https://www.prisma.io/) + PostgreSQL
- Redis (cache)
- JWT (access + refresh token), argon2 (hash des mots de passe)
- Swagger / OpenAPI

## Architecture du dépôt

```
.
├── client/                 # Frontend TanStack Start
│   ├── src/
│   │   ├── routes/         # Pages (routing fichiers)
│   │   ├── components/     # UI + composants métier
│   │   ├── services/       # Appels API par domaine
│   │   ├── hooks/api/      # Hooks TanStack Query
│   │   ├── stores/         # État global (auth)
│   │   └── types/          # Types partagés avec l'API
│   └── ...
└── backend/                 # API REST NestJS
    ├── prisma/
    │   └── schema.prisma    # Modèle de données
    ├── src/
    │   ├── auth/            # Authentification
    │   ├── modules/         # Un module par domaine métier
    │   ├── common/          # Guards, decorators, interceptors, filters
    │   └── ...
    └── ...
```

## Prérequis

- Node.js ≥ 20
- [Bun](https://bun.sh/) (gestionnaire de paquets utilisé sur ce projet)
- PostgreSQL ≥ 14
- Redis ≥ 6 (optionnel en développement — le cache se désactive
  proprement si `REDIS_URL` n'est pas défini)

## Installation

```bash
git clone https://github.com/<votre-compte>/health-hub-pro.git
cd health-hub-pro

# Backend
cd backend
bun install
cp .env.example .env   # renseigner les variables, voir ci-dessous
bunx prisma migrate dev
bunx prisma generate

# Frontend
cd ../client
bun install
cp .env.example .env
```

## Variables d'environnement

### `backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `REDIS_URL` | Chaîne de connexion Redis (optionnel en dev) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secrets de signature JWT |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | Durées de validité des tokens |
| `FRONTEND_URL` | Origine autorisée en CORS (ex: `http://localhost:3000`) |
| `TURNSTILE_SECRET_KEY` | Clé Cloudflare Turnstile (anti-bot à l'inscription) |

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de base de l'API (ex: `http://localhost:5000/api/v1`) |

> La liste exacte et à jour est toujours dans les fichiers `.env.example`
> de chaque application.

## Lancer le projet

```bash
# Terminal 1 — backend (port 5000 par défaut)
cd backend
bun run start:dev

# Terminal 2 — frontend
cd client
bun run dev
```

## Documentation API

Une fois le backend démarré, la documentation Swagger interactive est
disponible sur `http://localhost:5000/api-docs`.

## Tests

```bash
# Backend
cd backend
bun run test          # tests unitaires
bun run test:e2e       # tests end-to-end
```

## Roadmap

L'état d'avancement détaillé, phase par phase (administration, fiabilité,
extensions métier, mise en production) est documenté dans
[ROADMAP.md](./ROADMAP.md).

## Licence

Ce projet est sous licence MIT — voir le fichier [LICENSE](./LICENSE) pour
le détail.