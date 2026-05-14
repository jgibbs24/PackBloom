# MTG Pack Simulator

A full-stack Magic: The Gathering pack-opening simulator. The app lets you choose a supported set, move through a small landing/set-selection/opening flow, open a simplified play-booster-style pack, reveal cards all at once or one by one, and track session stats like pack value, best pull, mythics pulled, and net profit/loss.

The project is currently built as a local development monorepo:

```text
backend/   Spring Boot API
frontend/  React + TypeScript + Vite UI
```

Current release tag:

```text
v1.1.0 - Themed pack selection flow and pack type UI
```

## Current Features

- Open MTG packs from a React frontend backed by a Spring Boot API.
- Live Scryfall integration for card data, images, rarities, and prices.
- In-memory backend card-pool caching by set and slot, such as `blb:common` and `blb:rare`.
- Landing page with a rotating themed pack wrapper preview.
- Dedicated set-selection screen with set cards.
- Real pack wrapper image assets for each supported set and booster type.
- Supported set metadata powered by `GET /api/sets`.
- Generic pack-opening endpoint: `GET /api/packs/{setCode}/open`.
- Barebones play-booster style composition:
  - 10 commons
  - 3 uncommons
  - 1 rare or mythic
  - 1 land
- Mythic upgrade chance of roughly 12.5%.
- Frontend pack type selector with:
  - Play Booster
  - Collector Booster
- Backend pack opening supports `play` and simplified `collector` booster definitions.
- Backend set metadata includes MSRP for play boosters.
- Frontend MSRP display and session spend/profit calculations update from the selected pack type.
- Reveal modes:
  - Reveal all
  - Cinematic one-by-one reveal stack
- One-by-one reveal prevents opening a new pack until the current reveal is completed.
- Click any revealed card to view a larger preview.
- Rarity-colored hover borders for cards.
- Session-only binder page showing best pulls.
- Animated currency values for pack summary and session stats.
- Frontend-only session stats:
  - Packs opened
  - Total estimated value
  - Average pack value
  - Best card pulled
  - Best pack value
  - Mythics pulled
  - Net profit/loss using the selected pack type MSRP

## Tech Stack

### Backend

- Java 21
- Spring Boot
- Maven + Maven Wrapper
- Spring Web
- Jackson
- Scryfall API
- No database yet
- No external cache library yet

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS

## Requirements

- JDK 21
- Node.js and npm
- Internet access for first Maven/npm dependency downloads and live Scryfall calls

This project includes a Maven Wrapper, so a global Maven install is not required.

Example JDK 21 path on Windows:

```powershell
C:\Program Files\Eclipse Adoptium\jdk-21.x.x.x-hotspot
```

Adjust that path to match your local JDK 21 installation.

## Running Locally

Use two terminal windows: one for the backend and one for the frontend.

### Windows

Use PowerShell.

#### 1. Start The Backend

```powershell
cd "C:\Users\your_name\Documents\MTG-Pack-Simulator\backend"
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.x.x.x-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd spring-boot:run
```

#### 2. Start The Frontend

```powershell
cd "C:\Users\your_name\Documents\MTG-Pack-Simulator\frontend"
npm.cmd install
npm.cmd run dev
```

### macOS / Linux

Use Terminal.

#### 1. Start The Backend

```bash
cd ~/Documents/MTG-Pack-Simulator/backend
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
./mvnw spring-boot:run
```

If the Maven Wrapper is not executable after cloning:

```bash
chmod +x ./mvnw
```

On Linux, set `JAVA_HOME` to your local JDK 21 install path if `java` is not already configured.

#### 2. Start The Frontend

```bash
cd ~/Documents/MTG-Pack-Simulator/frontend
npm install
npm run dev
```

### Local URLs

The backend runs on:

```text
http://localhost:8080
```

If port `8080` is already in use:

```powershell
netstat -ano | findstr :8080
Stop-Process -Id <PID>
```

The frontend runs on:

```text
http://localhost:5173
```

Vite proxies `/api` requests to the backend.

For deployed frontend builds, set `VITE_API_BASE_URL` to the backend URL. Local development can leave it blank because the Vite proxy handles `/api` requests.

Example:

```bash
VITE_API_BASE_URL=https://your-backend.example.com
```

## Build And Verification

### Windows Backend Compile

```powershell
cd "C:\Users\your_name\Documents\MTG-Pack-Simulator\backend"
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.x.x.x-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd -DskipTests compile
```

### Windows Frontend Build

```powershell
cd "C:\Users\your_name\Documents\MTG-Pack-Simulator\frontend"
npm.cmd run build
```

### Windows Frontend Tests

```powershell
cd "C:\Users\your_name\Documents\MTG-Pack-Simulator\frontend"
npm.cmd run test
```

### macOS / Linux Backend Compile

```bash
cd ~/Documents/MTG-Pack-Simulator/backend
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
./mvnw -DskipTests compile
```

On Linux, set `JAVA_HOME` to your local JDK 21 install path if needed.

### macOS / Linux Frontend Build

```bash
cd ~/Documents/MTG-Pack-Simulator/frontend
npm run build
```

### macOS / Linux Frontend Tests

```bash
cd ~/Documents/MTG-Pack-Simulator/frontend
npm run test
```

### Backend Tests

Use the same Maven Wrapper command style for your platform:

```powershell
.\mvnw.cmd test
```

```bash
./mvnw test
```

## API Endpoints

### `GET /api/sets`

Returns the currently supported pack definitions.

Example response:

```json
[
  {
    "setCode": "blb",
    "setName": "Bloomburrow",
    "packType": "play-booster-barebones",
    "msrpUsd": 5.99
  }
]
```

### `GET /api/packs/{setCode}/open`

Opens a pack for the selected set code. The optional `boosterType` query parameter accepts `play` or `collector` and defaults to `play`.

Example:

```text
GET /api/packs/blb/open
GET /api/packs/blb/open?boosterType=collector
```

Example response:

```json
{
  "setCode": "blb",
  "cards": [
    {
      "id": "scryfall-id",
      "name": "Card Name",
      "rarity": "rare",
      "imageUrl": "https://...",
      "priceUsd": 1.23
    }
  ],
  "totalValueUsd": 8.45
}
```

## Backend Design Notes

- `PackController` exposes pack-opening endpoints.
- `PackOpeningService` owns pack generation and cache-backed card drawing.
- `PackDefinitionService` owns the currently supported in-memory pack definitions.
- `PackDefinition` describes a supported set, pack type, MSRP, and slots.
- `PackSlot` describes pack slots like commons, uncommons, rare/mythic, and land.
- `ScryfallClient` handles Scryfall HTTP calls and maps Scryfall responses into app-level `CardDto` objects.
- Raw Scryfall JSON is not returned to the frontend.
- Frontend-only theme metadata and CSS pack wrapper visuals live separately from backend pack definitions.

## Current Supported Sets

The app is structured for multiple sets. Current definitions include:

- `blb` - Bloomburrow
- `dsk` - Duskmourn: House of Horror
- `fdn` - Foundations
- `lci` - The Lost Caverns of Ixalan
- `mkm` - Murders at Karlov Manor
- `mom` - March of the Machine
- `one` - Phyrexia: All Will Be One
- `otj` - Outlaws of Thunder Junction
- `woe` - Wilds of Eldraine

All currently use the same temporary barebones play-booster composition.

## Known Limitations

- Pack collation is simplified and not yet fully accurate to real MTG booster rules.
- Foils are not implemented yet.
- Showcase, borderless, and alternate-art handling are not implemented yet.
- Collector booster collation is simplified and not yet fully accurate to real collector booster rules.
- Collector booster MSRP is currently frontend metadata.
- Session stats are frontend state only and reset on refresh.
- No database yet.
- No user accounts yet.
- Deployment config targets Vercel for the frontend and Render for the backend.

## Deployment Notes

The frontend and backend can be deployed separately.

- Frontend target: Vercel.
- Backend target: Render.
- Set the Vercel root directory to `frontend`.
- Set `VITE_API_BASE_URL` in Vercel to the deployed Render backend origin.
- Render uses `render.yaml` and `backend/Dockerfile` to build the Spring Boot API on Java 21.
- Set `APP_CORS_ALLOWED_ORIGINS` in Render to the deployed Vercel frontend origin.
- Keep local origins for local development only:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

Example backend property:

```properties
app.cors.allowed-origins=https://your-frontend.example.com
```

If a host exposes environment variables instead of property files, Spring Boot can read the same value from:

```text
APP_CORS_ALLOWED_ORIGINS=https://your-frontend.example.com
```

### Vercel Frontend

Recommended settings:

```text
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Environment variable:

```text
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

### Render Backend

Recommended settings:

```text
Blueprint: render.yaml
Runtime: Docker
Root Directory: backend
Dockerfile: backend/Dockerfile
Plan: Free for portfolio/demo use
```

Environment variable:

```text
APP_CORS_ALLOWED_ORIGINS=https://your-vercel-frontend.vercel.app
```

Render's free web services can cold start after inactivity. That is acceptable for a portfolio/demo app, but upgrade the plan if you want consistently fast first requests.

### Asset Optimization

Original PNG pack wrapper uploads live in:

```text
frontend/src/assets/pack-wrappers/
```

The app imports optimized WebP versions from:

```text
frontend/src/assets/pack-wrappers/optimized/
```

Regenerate optimized wrapper images after adding or replacing source PNGs:

```powershell
cd "C:\Users\your_name\Documents\MTG-Pack-Simulator\frontend"
npm.cmd run optimize:wrappers
```

```bash
cd ~/Documents/MTG-Pack-Simulator/frontend
npm run optimize:wrappers
```

## Disclaimer

This is an unofficial fan project. Magic: The Gathering, set names, card names, card images, pack wrapper art, and related trademarks belong to Wizards of the Coast. Card data and card images are provided through the Scryfall API where applicable. This project is not affiliated with, endorsed by, sponsored by, or approved by Wizards of the Coast or Scryfall.

## Roadmap / Backlog

### Documentation And Code Quality

- Add more detailed inline comments where helpful.
- Add focused tests for backend pack-generation behavior.
- Add frontend component tests later.

### Pack And Set Accuracy

- Improve collector booster generation accuracy.
- Add more accurate play-booster collation.
- Add foils.
- Add showcase, borderless, and alternate-art support.
- Add set-specific collector booster MSRP and metadata from the backend.
- Add more sets.

### User Experience

- Add fast mode / skip animation controls.
- Add rarity suspense reveal before card flips.
- Add mythic pull effects such as particles or confetti.
- Improve binder sorting/filtering and pull history details.
- Add session reset controls.
- Persist selected set, selected pack type, session stats, and binder data in `localStorage`.
- Improve responsive polish and broader CSS styling.

### Persistence And Infrastructure

- Add PostgreSQL later.
- Add Spring Data JPA later.
- Add Flyway migrations later.
- Add Caffeine caching later.
- Add deployment setup:
  - Frontend on Vercel
  - Backend on Render, Railway, or Fly.io

## Git Notes

Generated dependencies and build outputs are ignored:

- `frontend/node_modules/`
- `frontend/dist/`
- `backend/target/`

Do not commit local build artifacts or dependency folders.
