# ZENVOY Backend

ZENVOY Backend is a FastAPI service that powers route comparison, safety scoring, SOS dispatch, auth, and crime-data ingestion for the ZENVOY safety navigation product.

## System Role

The backend is responsible for:

- loading the Delhi walking graph into memory
- syncing seeded crime data into MongoDB at startup
- computing fast and safety-aware routes
- returning route previews and score breakdowns
- dispatching SOS SMS payloads through Twilio
- exposing auth endpoints for registration, login, and profile updates
- running preprocessing scripts that enrich graph edges with Mapillary and YOLOv8-derived visual signals

## User-Facing Behavior

From a user perspective, the backend only needs to provide:

- a fastest route
- a safest route
- route score details
- emergency SOS delivery
- account authentication when account flows are enabled

Users should not need to know about graph selection mode, Mongo collections, or preprocessing internals.

## Developer Docs

### Runtime architecture

Startup work in [`app/main.py`](/home/aniket/Desktop/stellaris/backend/app/main.py):

1. initialize MongoDB / Beanie
2. ensure the `users.username` unique index exists
3. sync seeded crimes into MongoDB
4. load `app/data/delhi_walk.graphml` into `app.state.graph`
5. expose `/health` and mount all versioned API routes under `/api/v1`

### API surface

Main router:

- [`app/api/v1/router.py`](/home/aniket/Desktop/stellaris/backend/app/api/v1/router.py)

Endpoints:

- `GET /api/v1/route/fast`
- `GET /api/v1/route/safe`
- `POST /api/v1/sos`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/profile`
- `GET /health`

### Route computation

Routing implementation:

- [`app/services/routing.py`](/home/aniket/Desktop/stellaris/backend/app/services/routing.py)
- [`app/services/safety.py`](/home/aniket/Desktop/stellaris/backend/app/services/safety.py)

Fast route:

- uses `networkx.shortest_path(..., weight="length")`

Safe route:

- builds a safety-aware edge cost using:
  - physical length
  - darkness penalty from `light_score`
  - crime proximity penalty near route edges
  - optional visual bonus from preprocessed Mapillary + YOLOv8 signals
- evaluates pure-safe, balanced-safe, and fallback-fast candidates

Key response fields returned by routing:

- `coordinates`
- `distance_km`
- `estimated_time_min`
- `score`
- `origin_preview`
- `destination_preview`
- `route_selection_mode` for safe routes
- optional `connaught_place` preview payload

### Crime data pipeline

Crime pipeline:

- [`app/services/crime_pipeline.py`](/home/aniket/Desktop/stellaris/backend/app/services/crime_pipeline.py)

What it does:

- fetches Delhi street-crime news
- uses Gemini extraction to turn articles into structured crime events
- inserts non-duplicate incidents into MongoDB

Persistent crime model:

- [`app/models/crime.py`](/home/aniket/Desktop/stellaris/backend/app/models/crime.py)

Collection name:

- `crime_reports`

Stored fields:

- `lat`
- `lng`
- `type`
- `severity`
- `description`
- `timestamp`

### Mapillary and YOLOv8

Preprocessing script:

- [`scripts/street_view_preprocessing.py`](/home/aniket/Desktop/stellaris/backend/scripts/street_view_preprocessing.py)

Model artifact:

- [`yolov8n.pt`](/home/aniket/Desktop/stellaris/backend/yolov8n.pt)

What the preprocessing script does:

1. loads the GraphML road network
2. fetches nearby Mapillary images for selected edges
3. runs YOLOv8 detections on the images
4. converts detections into a bounded `visual_score`
5. stores `visual_score`, `visual_score_available`, and node image metadata back into the graph

Important distinction:

- Mapillary imagery is used at runtime by the frontend for street-view lookup.
- YOLOv8 is used offline in backend preprocessing, not during route requests.

### SOS delivery

SOS service:

- [`app/api/v1/sos.py`](/home/aniket/Desktop/stellaris/backend/app/api/v1/sos.py)
- [`app/services/sms.py`](/home/aniket/Desktop/stellaris/backend/app/services/sms.py)

Behavior:

- If Twilio credentials are configured, a real SMS is sent with a Google Maps link.
- If Twilio credentials are missing, the endpoint falls back to mock mode.

### Auth

Auth routes:

- [`app/api/v1/auth.py`](/home/aniket/Desktop/stellaris/backend/app/api/v1/auth.py)

User request models:

- [`app/models/user.py`](/home/aniket/Desktop/stellaris/backend/app/models/user.py)

Supported flows:

- register a user
- login and receive a token
- fetch current profile
- update profile fields

## Configuration

Environment settings are defined in [`app/core/config.py`](/home/aniket/Desktop/stellaris/backend/app/core/config.py).

Required values:

```bash
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=zenvoy
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
MAPILLARY_TOKEN=...
NEWSAPI_KEY=...
GEMINI_API_KEY=...
GRAPH_PATH=app/data/delhi_walk.graphml
```

## Local Development

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload
```

Open interactive API docs:

```text
http://localhost:8000/docs
```

Check service health:

```text
http://localhost:8000/health
```

Run visual preprocessing:

```bash
python scripts/street_view_preprocessing.py
```

## Frontend Integration Note

The web repo currently calls unversioned endpoints in `src/services/routesService.js`, while this backend mounts routes under `/api/v1`. Integration should either:

1. update the frontend base paths to `/api/v1/...`, or
2. add unversioned compatibility routes in the backend

Until that is aligned, frontend and backend will disagree on route URLs.
