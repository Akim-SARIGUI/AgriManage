# AgriManage

Monorepo professionnel pour la gestion agricole.

## Stack

| App / package | Techno |
|---|---|
| `apps/web` | Nuxt 4 (compat) + Vue 3 + Vuetify + Tailwind |
| `apps/api` | NestJS + JWT cookies httpOnly + Helmet + Throttling |
| `packages/database` | Prisma + PostgreSQL |
| `packages/shared` | Types & enums partagés |
| `packages/api-client` | Client HTTP typé (`credentials: include`) |
| `packages/config` | TSConfig de base |

L’ancien code Express/Nuxt 3 est conservé dans `_legacy/` comme référence.

## Prérequis

- Node.js >= 20
- pnpm 9
- Docker (PostgreSQL via `docker compose`)

## Démarrage

```bash
# 1. Variables d'environnement
cp .env.example .env

# 2. Base de données (port 5433)
docker compose up -d

# 3. Installer
pnpm install

# 4. Générer le client Prisma + migration initiale
pnpm db:generate
pnpm db:migrate

# 5. Lancer API + Web
pnpm dev
```

- Web : http://localhost:3000  
- API : http://localhost:3001/api/health  

## Scripts utiles

```bash
pnpm dev:web      # front seul
pnpm dev:api      # API seule
pnpm build        # build monorepo
pnpm db:studio    # Prisma Studio
```

## Auth (socle)

- `POST /api/auth/register`
- `POST /api/auth/login` (cookies `access_token` + `refresh_token`)
- `POST /api/auth/admin/login`
- `GET  /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/password/request-reset`
- `POST /api/auth/password/reset`

## Parcelles

- `GET    /api/parcels`
- `GET    /api/parcels/:id`
- `POST   /api/parcels`
- `PATCH  /api/parcels/:id`
- `DELETE /api/parcels/:id`

UI : `/app/parcels` (auth requise)

## Cultures

- `GET    /api/crops?parcelId=`
- `GET    /api/crops/:id` (détail + activités + interventions)
- `POST   /api/crops`
- `PATCH  /api/crops/:id`
- `DELETE /api/crops/:id`
- `POST   /api/crops/:cropId/activities`
- `PATCH  /api/activities/:id`
- `DELETE /api/activities/:id`
- `POST   /api/activities/:activityId/interventions`
- `DELETE /api/interventions/:id`

UI : `/app/crops` et `/app/crops/:id`

## Stocks

- `GET    /api/stocks?type=`
- `GET    /api/stocks/meta`
- `GET    /api/stocks/:id`
- `POST   /api/stocks`
- `PATCH  /api/stocks/:id`
- `DELETE /api/stocks/:id`
- `POST   /api/stocks/:id/move` (entrée / sortie)
- `GET    /api/stock-history?type=&level=`

UI : `/app/stocks` (onglets + historique + alertes stock bas)

## Comptabilité

- `GET    /api/finance/summary`
- `GET/POST /api/finance/revenues`
- `PATCH/DELETE /api/finance/revenues/:id`
- `GET/POST /api/finance/expenses`
- `PATCH/DELETE /api/finance/expenses/:id`

UI : `/app/finance`

## Support

- `GET/POST /api/support/tickets`
- `GET/PATCH/DELETE /api/support/tickets/:id`
- `GET /api/admin/support/tickets` (ADMIN)
- `PATCH /api/admin/support/tickets/:id/respond` (ADMIN)

UI user : `/app/support`  
UI admin : `/admin/login` → `/admin/tickets`

## Utilisateurs (admin)

- `GET/POST /api/admin/users`
- `GET/PATCH/DELETE /api/admin/users/:id`
- `PATCH /api/admin/users/:id/unlock`

UI : `/admin/users`

Compte admin (seed) :

```bash
pnpm db:seed
# admin@agrimanage.local / Admin123!
```

## Météo

- `GET /api/weather/forecast?latitude=&longitude=&locationName=`
- `GET /api/weather/search?q=`

UI : `/app/weather` (+ aperçu sur le tableau de bord)

## Cartes & PDF

- Parcelles : champs `latitude`, `longitude`, `locationLabel`
- UI carte interactive (Leaflet) dans création/édition parcelle
- Vue globale : `/app/map`
- Rapports PDF : `/app/reports` (jspdf + autotable)

## Prochaines phases

1. Contenu recommandations dynamique
