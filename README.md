# SKILLAB UI

Web frontend for the **SKILLAB** project (https://skillab-project.eu) — a React-based dashboard that connects to the various SKILLAB backend microservices (skill detection, taxonomy, forecasting, diversity analysis, policy evaluation, etc.) and exposes them through five role-specific portals.

The same codebase ships five different installations, switched at build/runtime via the `REACT_APP_INSTALLATION` environment variable:

| Installation | Audience | Route prefix |
|---|---|---|
| `citizen` | Individual users exploring careers, skills, CV uploads, occupation recommendations | `/citizen/*` |
| `education` | Universities & training providers managing programs, courses, taxonomies | `/education/*` |
| `industry` | Companies tracking employee skills, gaps, hiring, job advertisements | `/industry/*` |
| `policy-education` | Policy makers focused on education | `/policy-education/*` |
| `policy-industry` | Policy makers focused on industry & labour market | `/policy-industry/*` |

---

## Tech stack

- **React** 18 + **react-router-dom** 6 (created with Create React App / `react-scripts` 5)
- **Reactstrap** + **Bootstrap** 4 + custom SCSS (Paper Dashboard theme)
- **Charts & viz**: ApexCharts, Chart.js, Recharts, D3, react-simple-maps, react-force-graph
- **Drag & drop**: `@hello-pangea/dnd`
- **Auth**: JWT (`jwt-decode`) + protected routes
- **HTTP**: Axios
- **Testing**: Jest + React Testing Library
- **Container**: Node 22 + Docker

## Prerequisites

- **Node.js** 22.x (matches the Dockerfile base image)
- **npm** 10+
- A running SKILLAB backend portal at the URLs configured in your `.env` file (defaults point at `https://portal.skillab-project.eu/*`)

## Getting started

```bash
# 1. Clone
git clone <repo-url> skillab-ui
cd skillab-ui

# 2. Install dependencies
npm ci

# 3. Configure environment
# Copy and edit the env file (see "Environment variables" below)
cp .env .dev.env

# 4. Start the dev server (uses .dev.env)
npm run dev
```

The app will be available on **http://localhost:3000**.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with variables from `.dev.env` |
| `npm start` | Start dev server with variables from `.env` |
| `npm run build` | Production build into `build/` |
| `npm test` | Run the Jest test suite once |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run install:clean` | Wipe `node_modules` + lockfile and reinstall from scratch |
| `npm run compile-sass` | Compile `paper-dashboard.scss` to CSS |
| `npm run minify-sass` | Compile and minify the SCSS bundle |
| `npm run map-sass` | Compile SCSS with source maps |

## Environment variables

All variables are prefixed with `REACT_APP_` so Create React App injects them at build time.

`REACT_APP_INSTALLATION` selects which portal flavour is built. Allowed values: `citizen`, `education`, `industry`, `policy-education`, `policy-industry`.

The remaining variables point at the SKILLAB backend services. Defaults in `.env` point at the production portal (`https://portal.skillab-project.eu/*`); override them locally as needed.

| Variable | Purpose |
|---|---|
| `REACT_APP_API_URL_USER_MANAGEMENT` | Auth, users, sessions |
| `REACT_APP_API_URL_KU` | Knowledge-unit detection backend |
| `REACT_APP_API_URL_KU_PUBLIC` | Public KU detection endpoint |
| `REACT_APP_API_URL_KPI` | Policy KPI backend |
| `REACT_APP_API_URL_JBPM` | jBPM business-central (workflows) |
| `REACT_APP_API_URL_TRACKER` | SKILLAB tracker (`skillab-tracker.csd.auth.gr`) |
| `REACT_APP_API_URL_TRACKER_USERNAME` / `_PASSWORD` | Basic-auth credentials for the tracker (do **not** commit) |
| `REACT_APP_API_URL_SKILLS_REQUIRED` | Required-skills service |
| `REACT_APP_API_URL_SKILLS_DIVERSITY` | Diversity analysis service |
| `REACT_APP_API_URL_SKILL_ARCHETYPAL_DIVERSITY` | Archetypal diversity (often local, `:8087`) |
| `REACT_APP_API_URL_SKILL_DEMAND_MATRIX` | Skill demand / HCV service |
| `REACT_APP_API_URL_CURRICULUM_SKILLS` | Curriculum-to-skills mapping |
| `REACT_APP_API_URL_GAP_WITH_COMPETITION` | Gap-with-competition analysis |
| `REACT_APP_API_URL_HIRING_MANAGEMENT` | Hiring management backend |
| `REACT_APP_API_URL_EMPLOYEE_MANAGEMENT` | Employee management backend |
| `REACT_APP_API_URL_SKILL_AGEING` | Skill ageing service |
| `REACT_APP_API_URL_GIANT_COMPONENT_NETWORKS` | Skill network analysis |
| `REACT_APP_API_URL_ESCOPLUS_SKILLS_EXTENDER` | ESCO+ skills extender |
| `REACT_APP_API_URL_OCCUPATIONAL_DEMAND_FORECASTER` | Occupational demand forecasting |
| `REACT_APP_API_URL_FUTURE_TECHNOLOGY_TRENDS_IDENTIFIER` | Future technology trends |
| `REACT_APP_API_URL_POLICY_SUCCESS_EVALUATOR` | Policy success evaluator |
| `REACT_APP_API_URL_ROLE_CLASSIFICATION` | Role classification service |
| `REACT_APP_API_URL_XAI_OCCUPATION_ANALYSER` | Explainable-AI occupation analyser |

> **Security:** never commit real credentials. `.dev.env` should remain local; use the deployment environment (Docker, Jenkins, Portainer) to inject secrets in production.

## Docker

Build and run with the included `Dockerfile` / `docker-compose.yml`:

```bash
# Build & start
docker compose up --build

# Or build the image manually
docker build -t skillab-ui .
docker run --rm -p 3000:3000 --env-file .env skillab-ui
```

The compose file exposes the container on port `3000` and tags it for the `skillab-all` Portainer team.

## CI/CD

A `jenkins/` folder is included for Jenkins-driven deployments. Image names follow `${DOCKER_REG}${DOCKER_REPO}${APP_NAME}:${DOCKER_TAG}` (configured at build time).

## Project structure

```
skillab-ui/
├── public/                       # Static assets, index.html
├── src/
│   ├── index.js                  # App entrypoint + route definitions
│   ├── ProtectedRoute.js         # JWT-guarded route wrapper
│   ├── ForgotPasswordPage.js
│   ├── PasswordResetPage.js
│   ├── layouts/                  # One layout per installation
│   │   ├── CitizenLayout.js
│   │   ├── EducationLayout.js
│   │   ├── IndustryLayout.js
│   │   ├── PolicyEducationLayout.js
│   │   ├── PolicyIndustryLayout.js
│   │   └── InitLayout.js
│   ├── routes/                   # Sidebar/route config per installation
│   │   ├── routesCitizen.js
│   │   ├── routesEducation.js
│   │   ├── routesIndustry.js
│   │   ├── routesPolicyEducation.js
│   │   └── routesPolicyIndustry.js
│   ├── views/                    # Page-level components
│   │   ├── citizen/              # CV upload, occupation/skill selection, recommendations
│   │   ├── education/            # Courses, programs, taxonomies
│   │   ├── industry/             # Employee skills, job ads, gap analysis, at-risk skills
│   │   ├── policies/             # Policies, KPIs, workflows, future-tech trends
│   │   ├── coOccurrence/         # Skill co-occurrence analytics
│   │   ├── demand/               # Demand forecasting
│   │   ├── diversity/            # Diversity analysis
│   │   ├── forecasting/          # Forecasting views
│   │   ├── hcv/                  # Human capital value / demand matrix
│   │   ├── supply/               # Supply-side analytics
│   │   ├── taxonomies/           # ESCO and custom taxonomies
│   │   ├── turf/                 # TURF analysis
│   │   ├── descriptiveExploratory/
│   │   ├── configuration/
│   │   ├── Login.js, Register.js, Dashboard.js, …
│   ├── components/               # Shared UI components
│   ├── utils/                    # Helpers (auth, formatting, API clients)
│   ├── variables/                # Static config, chart options, etc.
│   ├── assets/                   # SCSS, images, demo CSS, fonts
│   ├── __mocks__/                # Jest mocks
│   └── __tests__/                # Jest test suites
├── jenkins/                      # Jenkins pipeline definitions
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── babel.config.json
├── jsconfig.json
├── package.json
└── LICENSE.md
```

## Authentication flow

Public routes (`/`, `/login`, `/register`, `/forgot-password`, `/reset-password`) are wrapped by `InitLayout`. All installation routes (`/citizen/*`, `/industry/*`, etc.) are wrapped by `ProtectedRoute`, which decodes the JWT and redirects unauthenticated users to the login page. The token is obtained from `REACT_APP_API_URL_USER_MANAGEMENT`.

## Testing

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Tests live under `src/__tests__/` and use Jest + `@testing-library/react` (configured in `jest.config.js`).

## Troubleshooting

- **Blank page / 401 loops** — check that `REACT_APP_API_URL_USER_MANAGEMENT` is reachable and CORS is enabled for `http://localhost:3000`.
- **Wrong portal opens** — verify `REACT_APP_INSTALLATION` and restart the dev server (CRA only reads env vars at startup).
- **Dependency conflicts after pulling** — run `npm run install:clean` to rebuild from scratch.
- **SCSS not updating** — run `npm run compile-sass` (or `map-sass` during development).

## License

MIT — see [LICENSE.md](LICENSE.md).
