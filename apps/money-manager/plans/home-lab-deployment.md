# Migrate Money Manager into Home Lab Repo

## Context

The money-manager repo will be moved manually by the user to `apps/money-manager/` inside the home-lab repo. Once there, we need to:
1. Migrate the toolchain from npm → yarn + mise (matching personal-utils conventions)
2. Wire it into the home-lab's root `docker-compose.yaml` for VM deployment (build on VM, no registry)
3. Add a CI workflow matching the personal-utils pattern (path-filtered, mise-based)
4. Update the money-manager's nginx.conf upstream to match the home-lab compose service name
5. Add a `deploy` recipe in the money-manager justfile for one-command deployment from Mac

Deploy strategy: SSH to VM → `git pull` → `docker compose up -d --build` (build on VM).

---

## Part 1: Toolchain migration (npm → yarn + mise)

### `apps/money-manager/.mise.toml` — new file

Match personal-utils tooling (node 20, yarn 1.22, just 1):

```toml
[tools]
node = "20"
yarn = "1.22"
just = "1"
```

### `apps/money-manager/package.json` — switch to yarn workspaces

Change `"packageManager"` if present, and ensure workspaces are declared in yarn-compatible format. No script changes needed at root level — scripts will move to justfile.

The key change: remove `"packageManager": "npm@..."` if present. Yarn 1 automatically picks up `"workspaces": ["frontend", "backend"]`.

### `apps/money-manager/justfile` — migrate all npm commands to yarn, add deploy

```justfile
vm_host := env_var_or_default("MONEY_MANAGER_VM", "ubuntu@homelab")
home_lab_dir := env_var_or_default("HOME_LAB_DIR", "~/home-lab")

default:
    just --list

# Install dependencies
install:
    yarn install --frozen-lockfile

# Run development environment
dev:
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run production environment locally
run-prod:
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Lint + typecheck both workspaces
check:
    yarn workspace money-manager-frontend check
    yarn workspace money-manager-backend check

# Run backend tests
test-backend:
    yarn workspace money-manager-backend test

# Pre-commit: check + test
pre-commit:
    just check
    just test-backend

# Generate seed data (backend must be running)
seed *ARGS:
    node scripts/seed.mjs {{ARGS}}

# Deploy to VM: git pull + rebuild money-manager services
deploy:
    ssh {{vm_host}} "cd {{home_lab_dir}} && git pull && docker compose up -d --build money-manager-backend money-manager-frontend"
    @echo "Deployed to {{vm_host}}"
```

Note: workspace names (`money-manager-frontend`, `money-manager-backend`) come from `"name"` in each workspace's `package.json`. Verify these match or adjust accordingly.

### `apps/money-manager/backend/Dockerfile.prod` — npm → yarn

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN yarn install --production
COPY --from=builder /app/dist ./dist
CMD ["yarn", "start"]
```

### `apps/money-manager/backend/Dockerfile.dev` — npm → yarn

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
CMD ["yarn", "dev"]
```

### `apps/money-manager/frontend/Dockerfile.prod` — npm → yarn

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `apps/money-manager/frontend/Dockerfile.dev` — npm → yarn

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
CMD ["yarn", "dev"]
```

---

## Part 2: Home-lab integration

### `docker-compose.yaml` (home-lab root) — add money-manager services

```yaml
  money-manager-backend:
    build:
      context: ./apps/money-manager
      dockerfile: backend/Dockerfile.prod
    container_name: money-manager-backend
    restart: unless-stopped
    environment:
      - DATA_PATH=/app/data/snapshots.json
      - FEES_PATH=/app/data/fees.json
      - PORTFOLIO_PATH=/app/data/portfolio.json
      - PORTFOLIO_TARGETS_PATH=/app/data/portfolio-targets.json
    volumes:
      - ${MONEY_MANAGER_DATA_DIR:-./apps/money-manager/data}:/app/data

  money-manager-frontend:
    build:
      context: ./apps/money-manager
      dockerfile: frontend/Dockerfile.prod
    container_name: money-manager-frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - money-manager-backend
```

### `.env.example` (home-lab root) — add variable

```
MONEY_MANAGER_DATA_DIR=/opt/money-manager
```

### `apps/money-manager/frontend/nginx.conf` — fix upstream service name

Change `backend` → `money-manager-backend` to match the home-lab compose service name:

```nginx
location /api/ {
    proxy_pass http://money-manager-backend:3001;
    proxy_set_header Host $host;
}
```

---

## Part 3: CI workflow

### `.github/workflows/ci-money-manager.yml` (home-lab root) — new file

Mirrors personal-utils CI pattern exactly, using `mise-action`. `mise-action` reads `.mise.toml` and installs node, yarn, and just automatically — no separate tool install step needed.

```yaml
name: CI — Money Manager

on:
  pull_request:
    paths:
      - 'apps/money-manager/**'
      - '.github/workflows/ci-money-manager.yml'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
        with:
          working_directory: apps/money-manager
      - working-directory: apps/money-manager
        run: just install
      - working-directory: apps/money-manager
        run: just check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
        with:
          working_directory: apps/money-manager
      - working-directory: apps/money-manager
        run: just install
      - working-directory: apps/money-manager
        run: just test-backend
```

### `apps/money-manager/.github/` — delete

The existing `lint.yml` and `test.yml` inside money-manager won't fire from within the home-lab repo. Delete the entire `.github/` directory after moving.

---

## One-time VM setup (manual, once)

```bash
sudo mkdir -p /opt/money-manager/data
sudo chown $USER /opt/money-manager
echo "MONEY_MANAGER_DATA_DIR=/opt/money-manager" >> ~/home-lab/.env
```

---

## Summary of all files touched

| Repo | File | Action |
|---|---|---|
| money-manager | `.mise.toml` | Create |
| money-manager | `justfile` | Replace |
| money-manager | `backend/Dockerfile.prod` | Update (npm → yarn, node 20) |
| money-manager | `backend/Dockerfile.dev` | Update (npm → yarn, node 20) |
| money-manager | `frontend/Dockerfile.prod` | Update (npm → yarn, node 20) |
| money-manager | `frontend/Dockerfile.dev` | Update (npm → yarn, node 20) |
| money-manager | `frontend/nginx.conf` | Update upstream hostname |
| money-manager | `.github/` | Delete |
| home-lab | `docker-compose.yaml` | Add 2 services |
| home-lab | `.env.example` | Add `MONEY_MANAGER_DATA_DIR` |
| home-lab | `.github/workflows/ci-money-manager.yml` | Create |

---

## Verification

1. `cd apps/money-manager && just install` — yarn installs all workspaces without error
2. `just check` — biome + tsc pass for both workspaces
3. `just test-backend` — backend tests pass
4. `just run-prod` — prod containers build and start locally, app loads at `http://localhost:8080/`
5. `just deploy` — VM rebuilds and restarts only money-manager services; jellyfin/gluetun unaffected
6. `http://<vm-tailscale-ip>:8080/` — app loads, API calls work
