# MTG Pack Simulator

A full-stack Magic: The Gathering pack-opening simulator. The app lets you pick a supported set, open a barebones play booster, reveal cards all at once or one by one, and track session stats like pack value, best pull, mythics pulled, and net profit/loss.

The project is currently built as a local development monorepo:

```text
backend/   Spring Boot API
frontend/  React + TypeScript + Vite UI
```

## Current Features

- Open MTG packs from a React frontend backed by a Spring Boot API.
- Live Scryfall integration for card data, images, rarities, and prices.
- In-memory backend card-pool caching by set and slot, such as `blb:common` and `blb:rare`.
- Supported set selector powered by `GET /api/sets`.
- Generic pack-opening endpoint: `GET /api/packs/{setCode}/open`.
- Barebones play-booster style composition:
  - 10 commons
  - 3 uncommons
  - 1 rare or mythic
  - 1 land
- Mythic upgrade chance of roughly 12.5%.
- Reveal modes:
  - Reveal all
  - Cinematic one-by-one reveal stack
- Click any revealed card to view a larger preview.
- Rarity-colored hover borders for cards.
- Frontend-only session stats:
  - Packs opened
  - Total estimated value
  - Average pack value
  - Best card pulled
  - Best pack value
  - Mythics pulled
  - Net profit/loss using a temporary pack MSRP

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

The local JDK 21 path used during development was:

```powershell
C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot
```

Adjust that path if your JDK 21 installation is somewhere else.

## Running Locally

Use two PowerShell windows.

### 1. Start The Backend

```powershell
cd "C:\Users\Jameson\Documents\New project\backend"
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

If port `8080` is already in use:

```powershell
netstat -ano | findstr :8080
Stop-Process -Id <PID>
```

### 2. Start The Frontend

```powershell
cd "C:\Users\Jameson\Documents\New project\frontend"
npm.cmd install
npm.cmd run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Vite proxies `/api` requests to the backend.

## Build And Verification

### Backend Compile

```powershell
cd "C:\Users\Jameson\Documents\New project\backend"
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd -DskipTests compile
```

### Frontend Build

```powershell
cd "C:\Users\Jameson\Documents\New project\frontend"
npm.cmd run build
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
    "packType": "play-booster-barebones"
  }
]
```

### `GET /api/packs/{setCode}/open`

Opens a pack for the selected set code.

Example:

```text
GET /api/packs/blb/open
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
- `PackDefinition` describes a supported set and pack type.
- `PackSlot` describes pack slots like commons, uncommons, rare/mythic, and land.
- `ScryfallClient` handles Scryfall HTTP calls and maps Scryfall responses into app-level `CardDto` objects.
- Raw Scryfall JSON is not returned to the frontend.

## Current Supported Sets

The app is structured for multiple sets. Current definitions include:

- `blb` - Bloomburrow
- `fdn` - Foundations
- `mkm` - Murders at Karlov Manor

All currently use the same temporary barebones play-booster composition.

## Known Limitations

- Pack collation is simplified and not yet fully accurate to real MTG booster rules.
- Foils are not implemented yet.
- Showcase, borderless, and alternate-art handling are not implemented yet.
- Collector boosters are not implemented yet.
- Pack MSRP is currently a frontend constant rather than set-specific backend data.
- Session stats are frontend state only and reset on refresh.
- No database yet.
- No user accounts yet.
- No deployment configuration yet.

## Roadmap / Backlog

### Documentation And Code Quality

- Add more detailed inline comments where helpful.
- Add focused tests for backend pack-generation behavior.
- Add frontend component tests later.

### Pack And Set Accuracy

- Add more sets.
- Add set-specific pack MSRP.
- Add more accurate play-booster collation.
- Add foils.
- Add showcase, borderless, and alternate-art support.
- Add collector booster support.
- Add set-specific pack wrappers and theme data.

### User Experience

- Add a landing page with a Play button.
- Add a dedicated set-selection screen.
- Move into the main opening screen after set selection.
- Add a binder page for best pulls during a session.
- Add animated total value counters.
- Add pack wrapper art and wrapper-opening animation.
- Add mythic pull effects such as particles or confetti.
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
