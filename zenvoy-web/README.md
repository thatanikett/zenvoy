# ZENVOY Web

ZENVOY is a React + Vite web client for safety-first urban navigation. The app compares a safest route and a fastest route, shows route-level safety evidence, opens nearby Mapillary street imagery, overlays Mapillary sign/object data, and exposes an SOS flow backed by the FastAPI service in the sibling backend repository.

## User Docs

### What the app does

- Lets the user choose an origin and destination on a live map.
- Fetches both the safe route and the fast route from the backend.
- Shows route score, lighting score, crime count, and other route-level callouts.
- Opens the nearest Mapillary street image when the user clicks on the map.
- Lets the user inspect Mapillary sign and object overlays from the map data panel.
- Keeps an SOS action available inside the map experience.

### How it works for a user

1. Open the web app and set the start and destination points.
2. Compare the safe and fast route responses on the same map.
3. Read the safety panel to understand why one route scores better.
4. Tap the map to inspect nearby street imagery through Mapillary.
5. Use sign and object overlays to add street-level context.
6. Trigger SOS if help needs to be requested immediately.

### What data is relevant to a user

- Relevant: safest route, fastest route, ETA, safety score, lighting score, nearby crime count, route warnings, street imagery, overlay filters, SOS.
- Not relevant: graph loading, MongoDB models, Twilio credentials, route selection fallback mode, preprocessing scripts, token generation.

### Live demonstrations included in the product

- `How It Works` page: audience dropdown for `User view` and `Developer view`.
- Live app surface: route comparison and street verification UI.
- Mapillary demonstrations: sign and object sprite catalogs visible in the docs page and runtime overlays in the app.
- Backend demonstrations: quick links to `http://localhost:8000/health` and `http://localhost:8000/docs`.

## Developer Docs

### Frontend architecture

- `src/App.jsx`: lightweight route switcher for landing page, docs page, and live app.
- `src/components/LandingPage.jsx`: marketing/entry surface.
- `src/components/HowItWorksPage.jsx`: structured user/developer documentation with audience dropdown.
- `src/components/MapExperience.jsx`: main interaction shell for routing, street view, overlays, and SOS.
- `src/components/MapView.jsx`: Mapbox rendering and route/overlay drawing.
- `src/components/StreetViewPanel.jsx`: Mapillary image preview panel.
- `src/components/MapDataPanel.jsx`: Mapillary sign and object filter UI.

### Backend integration

The frontend expects the FastAPI service to run on `VITE_API_URL` and currently defaults to `http://localhost:8000`.

Current route and SOS calls:

- `GET /route/safe`
- `GET /route/fast`
- `POST /sos`

Backend repo cloned locally for this project:

- [`../backend`](/home/aniket/Desktop/stellaris/backend)

Note: the cloned backend actually exposes versioned endpoints under `/api/v1`, for example `/api/v1/route/safe`, `/api/v1/route/fast`, and `/api/v1/sos`. If you want the frontend to target the versioned API exactly, align `src/services/routesService.js` with the backend router prefix.

### Routing flow

1. `MapExperience` collects origin and destination.
2. `src/api.js` calls `getSafeRoute()` and `getFastRoute()` concurrently.
3. Axios sends requests through `src/services/apiClient.js`.
4. The backend computes path geometry and score breakdown.
5. The frontend renders both routes and opens the analysis panel.

### Mapillary usage

Runtime Mapillary usage:

- `src/services/mapillaryService.js` uses `mapillary-js` providers to fetch the nearest image node for a clicked map point.
- `MapExperience` opens `StreetViewPanel` with the resulting imagery payload.

Frontend Mapillary data overlays:

- Local manifests are loaded from:
  - `public/mapillary-sprites/package_signs.json`
  - `public/mapillary-sprites/package_objects.json`
- Local sprite sheets are displayed from:
  - `public/mapillary-sprites/package_signs.png`
  - `public/mapillary-sprites/package_objects.png`

### YOLOv8 usage

YOLOv8 is not executed in the web client. It is part of backend preprocessing.

Backend script:

```bash
cd ../backend
python scripts/street_view_preprocessing.py
```

What it does:

- pulls nearby Mapillary images for graph edges
- loads `yolov8n.pt`
- detects objects from imagery
- computes `visual_score`
- writes edge metadata such as `visual_score`, `visual_score_available`, `image_url`, and `image_available`

### Environment

Create a `.env` file in the web repo with:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_MAPILLARY_TOKEN=your_mapillary_token
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false
```

### Local development

Install and run:

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Backend Notes That Matter To Frontend Developers

- FastAPI app entrypoint: [`app/main.py`](/home/aniket/Desktop/stellaris/backend/app/main.py)
- Routing endpoints: [`app/api/v1/routes.py`](/home/aniket/Desktop/stellaris/backend/app/api/v1/routes.py)
- SOS endpoint: [`app/api/v1/sos.py`](/home/aniket/Desktop/stellaris/backend/app/api/v1/sos.py)
- Auth endpoints: [`app/api/v1/auth.py`](/home/aniket/Desktop/stellaris/backend/app/api/v1/auth.py)
- Routing engine: [`app/services/routing.py`](/home/aniket/Desktop/stellaris/backend/app/services/routing.py)
- Safety scoring: [`app/services/safety.py`](/home/aniket/Desktop/stellaris/backend/app/services/safety.py)
- Crime ingestion pipeline: [`app/services/crime_pipeline.py`](/home/aniket/Desktop/stellaris/backend/app/services/crime_pipeline.py)
- YOLOv8 + Mapillary preprocessing: [`scripts/street_view_preprocessing.py`](/home/aniket/Desktop/stellaris/backend/scripts/street_view_preprocessing.py)

## Current mismatch to be aware of

The frontend currently calls unversioned endpoints (`/route/safe`, `/route/fast`, `/sos`), while the cloned backend mounts the router under `/api/v1`. The docs now reflect both sides clearly, but production integration should standardize one base path.
