# PackBloom

PackBloom is a full-stack Magic: The Gathering pack-opening simulator. It lets you choose a supported set, pick a booster type, open packs with real wrapper art, reveal cards all at once or one by one, track pulls and value, and play a head-to-head Pack Battle mode.

Live app:

```text
https://packbloom.vercel.app
```

Repository:

```text
https://github.com/jgibbs24/PackBloom
```

## Project Structure

```text
backend/   Spring Boot API
frontend/  React + TypeScript + Vite UI
```

## Current Features

- Landing page with rotating real pack wrapper art.
- Mode selection for:
  - Open Packs
  - Pack Battle
- Set selection screen with per-set booster type choices.
- Supported booster types:
  - Play Booster
  - Collector Booster
- Real optimized WebP pack wrapper assets for each supported set and booster type.
- Live Scryfall integration for card data, images, rarities, and prices.
- Backend card-pool caching and warmup endpoints to reduce slow first opens.
- Pack reveal modes:
  - Reveal all
  - One-by-one cinematic reveal
  - Fast Mode for quicker opening
- One-by-one reveal locks opening controls until the current reveal is complete.
- Mythic reveal sparkle effect.
- Optional audio controls:
  - Global mute
  - Music toggle
  - SFX toggle
  - Volume slider
- Chase tracker with hit banner/history marker.
- Clickable card preview modal.
- Session stats:
  - Packs opened
  - Total estimated value
  - Average pack value
  - Best card pulled
  - Best pack value
  - Mythics pulled
  - Net profit/loss using selected booster MSRP
- Binder page with:
  - Best pulls
  - Full pulled-card binder
  - Search/filter/sort controls
  - Duplicate tracking
- Pack history page with filtering, sorting, chase hit details, and card lists.
- Local persistence for selected set, booster choices, reveal mode, session stats, binder, pack history, audio preferences, fast mode, and chase tracker.
- Reset controls for local session state.

## Pack Battle Mode

Pack Battle is a dedicated head-to-head mode.

Current Pack Battle features:

- Two-player name entry.
- Reveal-all battle flow.
- One-by-one battle flow with paired reveals.
- Running total for each side during one-by-one reveal.
- Newest card appears on top of the previous card stack.
- Winner/draw state after the battle completes.
- Battle session stats:
  - Wins per player
  - Win percentage
  - Best pack
  - Biggest win margin
- Reset battle stats button.
- Battle history with:
  - Winner or draw
  - Margin
  - Player names
  - Set
  - Booster type
  - Both pack totals
  - Best pull from each side
- Battle stats/history persist in local storage and survive refresh.

## Tech Stack

### Backend

- Java 21
- Spring Boot
- Maven + Maven Wrapper
- Spring Web
- Jackson
- Scryfall API
- Docker for deployment

### Frontend

- React 18
- TypeScript
- Vite
- TailwindCSS
- Vitest
- Sharp for pack-wrapper image optimization

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

Backend:

```text
http://localhost:8080
```

Frontend:

```text
http://localhost:5173
```

Vite proxies `/api` requests to the backend during local development.

For deployed frontend builds, set `VITE_API_BASE_URL` to the backend URL. Local development can leave it blank.

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

### Windows Backend Tests

```powershell
cd "C:\Users\your_name\Documents\MTG-Pack-Simulator\backend"
.\mvnw.cmd test
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

### macOS / Linux Backend Tests

```bash
cd ~/Documents/MTG-Pack-Simulator/backend
./mvnw test
```

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

## API Endpoints

### `GET /api/health`

Returns a simple backend health response.

### `GET /api/sets`

Returns the currently supported set metadata.

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

Examples:

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
      "priceUsd": 1.23,
      "priceAvailable": true,
      "finish": null,
      "treatment": null,
      "slot": "rare-or-mythic"
    }
  ],
  "totalValueUsd": 8.45
}
```

### `GET /api/packs/{setCode}/warmup`

Starts cache warmup for a set and booster type.

Example:

```text
GET /api/packs/blb/warmup?boosterType=collector
```

### `GET /api/packs/{setCode}/warmup/status`

Returns warmup status for a set and booster type.

Example:

```text
GET /api/packs/blb/warmup/status?boosterType=collector
```

## Backend Design Notes

- `PackController` exposes pack-opening and warmup endpoints.
- `PackOpeningService` owns pack generation and cache-backed card drawing.
- `PackDefinitionService` owns in-memory pack definitions.
- `PackDefinition` describes supported set, booster type, MSRP, and slots.
- `PackSlot` describes slots like commons, uncommons, rare/mythic, land, collector rare/mythic, and special treatment fallback slots.
- `ScryfallClient` handles Scryfall HTTP calls and maps responses into app-level `CardDto` objects.
- Raw Scryfall JSON is not returned to the frontend.
- The backend currently uses in-memory data and cache state only.

## Current Supported Sets

- `blb` - Bloomburrow
- `dsk` - Duskmourn: House of Horror
- `fdn` - Foundations
- `lci` - The Lost Caverns of Ixalan
- `mkm` - Murders at Karlov Manor
- `mom` - March of the Machine
- `one` - Phyrexia: All Will Be One
- `otj` - Outlaws of Thunder Junction
- `woe` - Wilds of Eldraine

Each supported set currently has play and collector definitions plus matching play and collector wrapper art.

## Current Pack Modeling

Play boosters use a simplified structure:

- 10 commons
- 3 uncommons
- 1 rare or mythic
- 1 land

Collector boosters use a simplified rare-heavy structure with broad slots for:

- foil commons
- foil uncommons
- foil rare/mythic
- extended-art rare/mythic
- showcase/borderless rare/mythic
- foil land

Collector boosters are playable in the app, but they are not yet exact set-specific collector booster simulations.

## Deployment Notes

The app is deployed as separate frontend and backend services.

- Frontend: Vercel
- Backend: Render
- Frontend production URL: `https://packbloom.vercel.app`
- Backend production URL: `https://mtg-pack-simulator-api.onrender.com`

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
VITE_API_BASE_URL=https://mtg-pack-simulator-api.onrender.com
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
APP_CORS_ALLOWED_ORIGINS=https://packbloom.vercel.app
```

Render free web services can cold start after inactivity. PackBloom shows user-facing engine wake/warmup messaging for this.

## Pack Wrapper Assets

Original uploaded PNG wrapper art lives in:

```text
frontend/src/assets/pack-wrappers/
```

Optimized WebP versions live in:

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

## Known Limitations

- Pack collation is simplified and not yet fully accurate to official MTG booster rules.
- Collector booster collation is generic and not yet set-specific.
- Foil behavior is represented only loosely in collector slot labels; true foil treatment modeling is not complete.
- Showcase, borderless, extended-art, and special treatment slots are broad approximations.
- Collector booster MSRP is currently static metadata.
- Pricing depends on Scryfall availability and can be missing for some prints.
- Local persistence uses browser `localStorage`; there is no database yet.
- No user accounts yet.
- Render free-tier cold starts can make first backend requests slower.

## Roadmap / Backlog

### Pack And Set Accuracy

- Add set-specific collector booster definitions.
- Improve play-booster collation.
- Improve foil/treatment modeling.
- Add special guest/list-style slots where relevant.
- Improve collector booster MSRP/market price metadata.
- Add more sets.

### Collection Features

- Set checklist and collection completion percentage.
- Better all-time best pulls gallery.
- Favorite/star cards.
- More binder filters and saved views.

### Game Modes

- Continue polishing Pack Battle history and presentation.
- Add sealed pool builder later.

### Persistence And Infrastructure

- Design initial database schema.
- Add PostgreSQL later.
- Add Spring Data JPA later.
- Add Flyway migrations later.
- Add user accounts later.

### Testing And Code Quality

- Add more backend pack-generation tests.
- Add frontend component tests for battle, binder, history, and reveal flows.
- Add more comments around complex pack-generation logic.

## Disclaimer

This is an unofficial fan project. Magic: The Gathering, set names, card names, card images, pack wrapper art, and related trademarks belong to Wizards of the Coast. Card data and card images are provided through the Scryfall API where applicable. This project is not affiliated with, endorsed by, sponsored by, or approved by Wizards of the Coast or Scryfall.

## Git Notes

Generated dependencies and build outputs are ignored:

- `frontend/node_modules/`
- `frontend/dist/`
- `backend/target/`

Do not commit local build artifacts or dependency folders.
