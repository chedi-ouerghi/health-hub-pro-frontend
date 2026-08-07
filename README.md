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