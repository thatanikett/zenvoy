import { useEffect, useState } from 'react'
import heroImage from '../assets/hero.png'

const TRACKS = {
  user: {
    label: 'User',
    eyebrow: 'User guide',
    title: 'Features and everyday usage inside ZENVOY.',
    intro:
      'This view explains the product from the user side: what features are available, what each one helps with, and how the route decision flow works in practice.',
    facts: [
      { label: 'Route features', value: 'Safe + Fast' },
      { label: 'Street context', value: 'Mapillary' },
      { label: 'Emergency action', value: 'SOS' },
    ],
    scope: [
      ['Main features', 'Safest route, fastest route, score panel, Mapillary street view, sign/object overlays, and SOS.'],
      ['What the user sees', 'Route tradeoffs, safety callouts, street images, map layers, and action buttons.'],
      ['What stays hidden', 'Graph routing logic, crime ingestion, model preprocessing, database setup, and provider credentials.'],
    ],
    steps: [
      {
        title: 'Search the route',
        body: 'Choose origin and destination, then let the app fetch both route options together.',
      },
      {
        title: 'Compare the two choices',
        body: 'Review safest and fastest routes side by side with route score, estimated time, and warnings.',
      },
      {
        title: 'Open the safety panel',
        body: 'Use the analysis area to understand lighting quality, nearby crime count, and route-specific reasoning.',
      },
      {
        title: 'Verify with street evidence',
        body: 'Tap on the map to open nearby Mapillary imagery and inspect how the street looks before moving.',
      },
      {
        title: 'Use overlay features',
        body: 'Toggle Mapillary sign and object layers to understand the route environment in more detail.',
      },
      {
        title: 'Keep SOS ready',
        body: 'If conditions change, the SOS action sends the current location to the configured emergency contact flow.',
      },
    ],
  },
  developer: {
    label: 'Developer',
    eyebrow: 'Developer guide',
    title: 'System flow, scoring pipeline, and backend ownership.',
    intro:
      'This view explains how the product works technically: frontend state and service calls, FastAPI route handling, graph routing, Mongo crime reads, Mapillary integration, and YOLOv8 preprocessing. The presentation is intentionally cleaner and more documentation-oriented, taking cues from official React and Ultralytics product docs.',
    facts: [
      { label: 'Frontend', value: 'React + Vite' },
      { label: 'Backend', value: 'FastAPI' },
      { label: 'Vision', value: 'YOLOv8n' },
    ],
    scope: [
      ['Frontend runtime', '`src/api.js`, `src/services/routesService.js`, `src/services/mapillaryService.js`, `src/components/MapExperience.jsx`.'],
      ['Backend runtime', '`app/main.py`, `app/api/v1/routes.py`, `app/api/v1/sos.py`, `app/api/v1/auth.py`, `app/services/routing.py`, `app/services/safety.py`.'],
      ['Offline preprocessing', '`scripts/street_view_preprocessing.py` uses Mapillary images plus `yolov8n.pt` to compute `visual_score` for graph edges.'],
    ],
    steps: [
      {
        title: 'Frontend issues route requests',
        body: 'The React client captures origin and destination, then requests fast and safe routes through Axios-backed service helpers.',
      },
      {
        title: 'FastAPI resolves route inputs',
        body: 'The backend maps coordinates to nearest graph nodes, loads crime reports, and prepares route computation using the in-memory graph.',
      },
      {
        title: 'Safe route uses weighted edges',
        body: 'The weighting function blends length, darkness penalty, crime proximity, and optional visual bonus from preprocessed visual metadata.',
      },
      {
        title: 'Runtime Mapillary stays client-side',
        body: 'User map clicks trigger nearest-image lookup through `mapillary-js`, which powers the live street-view panel.',
      },
      {
        title: 'YOLOv8 runs offline, not at request time',
        body: 'The backend preprocessing script fetches Mapillary edge imagery, runs `yolov8n.pt`, computes bounded visual scores, and stores them back in the graph data.',
      },
      {
        title: 'SOS and auth remain backend-owned',
        body: 'Emergency SMS delivery, login, registration, and profile updates are served through FastAPI endpoints rather than being embedded into frontend logic.',
      },
    ],
  },
}

const API_POINTS = [
  {
    method: 'GET',
    path: '/api/v1/route/safe',
    summary: 'Computes the safety-oriented route and returns geometry, score payloads, previews, and route selection metadata.',
  },
  {
    method: 'GET',
    path: '/api/v1/route/fast',
    summary: 'Computes the shortest route while still returning score data for UI comparison.',
  },
  {
    method: 'POST',
    path: '/api/v1/sos',
    summary: 'Dispatches an emergency payload with coordinates, user name, and contact number.',
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Returns an auth token and user payload for account-aware flows.',
  },
]

const DEV_DEMOS = [
  {
    title: 'Backend health',
    body: 'Use the health probe to verify service availability and whether the routing graph has been loaded.',
    cta: 'Open /health',
    href: 'http://localhost:8000/health',
  },
  {
    title: 'OpenAPI docs',
    body: 'Use the generated API docs to validate endpoint signatures and payload structure during integration.',
    cta: 'Open /docs',
    href: 'http://localhost:8000/docs',
  },
  {
    title: 'Launch app',
    body: 'Open the live map to exercise the real route, imagery, and overlay flow from the frontend side.',
    cta: 'Open app',
    href: '/app',
  },
]

function DataTable({ rows }) {
  return (
    <div className="how-data-table">
      {rows.map(([label, value]) => (
        <div key={label} className="how-data-row">
          <strong>{label}</strong>
          <span>{value}</span>
        </div>
      ))}
    </div>
  )
}

export default function HowItWorksPage({ onNavigate }) {
  const [track, setTrack] = useState('user')
  const activeTrack = TRACKS[track]

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.14 })

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-shell">
      <div className="landing-noise" />
      <header className="landing-nav">
        <button type="button" className="landing-brand landing-brand-button" onClick={() => onNavigate('/')}>
          <span className="landing-brand-mark">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="#10161d" strokeWidth="1.5" />
              <circle cx="7" cy="7" r="2" fill="#10161d" />
            </svg>
          </span>
          <span>
            <strong>ZENVOY</strong>
            <small>How it works</small>
          </span>
        </button>

        <nav className="landing-links">
          <a href="#overview">Overview</a>
          <a href="#evidence">Evidence</a>
          <a href="#backend">{track === 'user' ? 'Support' : 'Backend'}</a>
        </nav>

        <button type="button" className="landing-cta landing-cta-small" onClick={() => onNavigate('/app')}>
          Launch App
        </button>
      </header>

      <main className={`how-shell ${track === 'developer' ? 'how-shell-dev' : ''}`}>
        <section id="overview" className="landing-section how-hero" data-reveal>
          <span>{activeTrack.eyebrow}</span>
          <h1>{track === 'user' ? 'How ZENVOY helps users choose safer routes.' : 'How ZENVOY works under the hood.'}</h1>
          <p>{activeTrack.intro}</p>

          <div className="how-switcher">
            <label className="how-switcher-label" htmlFor="how-role-select">Audience</label>
            <select
              id="how-role-select"
              className="how-select"
              value={track}
              onChange={(event) => setTrack(event.target.value)}
            >
              <option value="user">User view</option>
              <option value="developer">Developer view</option>
            </select>
          </div>
        </section>

        <section className="how-feature-grid landing-section">
          <article className={`how-panel how-panel-highlight ${track === 'developer' ? 'how-panel-reactive' : ''}`} data-reveal>
            <span>{activeTrack.eyebrow}</span>
            <h2>{activeTrack.title}</h2>
            <p>{activeTrack.intro}</p>
            <div className="how-fact-grid">
              {activeTrack.facts.map((fact) => (
                <div key={fact.label} className="how-fact-card">
                  <strong>{fact.value}</strong>
                  <span>{fact.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={`how-panel ${track === 'developer' ? 'how-panel-technical' : ''}`} data-reveal>
            <span>{track === 'user' ? 'Feature scope' : 'Technical scope'}</span>
            <h2>{track === 'user' ? 'What matters to the user.' : 'What a developer should inspect.'}</h2>
            <DataTable rows={activeTrack.scope} />
          </article>
        </section>

        <section className="landing-section" data-reveal>
          <div className="landing-section-head">
            <span>{activeTrack.label} flow</span>
            <h2>{track === 'user' ? 'Feature-first explanation.' : 'Technical execution flow.'}</h2>
            <p>
              {track === 'user'
                ? 'This section stays practical and product-focused, explaining the features in the same order a user encounters them.'
                : 'This section describes the system path more directly, using a cleaner technical style inspired by documentation-oriented product sites.'}
            </p>
          </div>

          <div className="how-step-grid">
            {activeTrack.steps.map((step, index) => (
              <article key={step.title} className={`how-step-card ${track === 'developer' ? 'how-step-card-dev' : ''}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="evidence" className="landing-section">
          <div className="landing-section-head" data-reveal>
            <span>Mapillary + YOLOv8</span>
            <h2>{track === 'user' ? 'Street evidence and map features used in the app.' : 'Runtime imagery and offline visual scoring.'}</h2>
            <p>
              {track === 'user'
                ? 'Mapillary is a user-facing feature in ZENVOY. It helps the user visually inspect the street and understand sign and object context around a route.'
                : 'Mapillary has two roles here: live imagery lookup in the frontend and edge-level enrichment in backend preprocessing. YOLOv8 is used only in preprocessing.'}
            </p>
          </div>

          <div className="how-media-grid">
            <article className="how-media-card" data-reveal>
              <div className="how-media-frame">
                <img src={heroImage} alt="ZENVOY live route comparison interface" />
              </div>
              <div className="how-media-copy">
                <span>{track === 'user' ? 'Live app' : 'React interface'}</span>
                <h3>{track === 'user' ? 'One map view for routes, evidence, and action.' : 'The main React surface coordinates route state, overlays, and imagery lookups.'}</h3>
                <p>
                  {track === 'user'
                    ? 'Users compare routes, inspect street evidence, and access SOS from this single interface.'
                    : 'This UI is driven by `MapExperience`, service calls, local overlay state, and map click handlers.'}
                </p>
              </div>
            </article>

            <article className="how-media-card" data-reveal>
              <div className="how-media-frame how-media-sprite">
                <img src="/mapillary-sprites/package_signs.png" alt="Mapillary traffic sign sprite catalog" />
              </div>
              <div className="how-media-copy">
                <span>Mapillary signs</span>
                <h3>{track === 'user' ? 'Traffic sign overlays available in the map.' : 'Traffic sign sprite groups loaded into the frontend filter system.'}</h3>
                <p>
                  {track === 'user'
                    ? 'These overlays help users understand road context before choosing a route.'
                    : 'The frontend loads local sign manifests and sprite assets so filters stay fast and deterministic.'}
                </p>
              </div>
            </article>

            <article className="how-media-card" data-reveal>
              <div className="how-media-frame how-media-sprite">
                <img src="/mapillary-sprites/package_objects.png" alt="Mapillary object sprite catalog" />
              </div>
              <div className="how-media-copy">
                <span>Mapillary objects</span>
                <h3>{track === 'user' ? 'Object overlays that add local context.' : 'Object categories used in the route-context overlay flow.'}</h3>
                <p>
                  {track === 'user'
                    ? 'Users can inspect extra street context beyond the route line itself.'
                    : 'Object categories are loaded from the local package so the map layer UI has a stable catalog.'}
                </p>
              </div>
            </article>

            <article className="how-media-card" data-reveal>
              <div className={`how-code-card ${track === 'developer' ? 'how-code-card-dev' : ''}`}>
                <span>YOLOv8 preprocessing demo</span>
                <pre>{`cd ../backend
python scripts/street_view_preprocessing.py

# Pipeline
# 1. fetch Mapillary edge images
# 2. run yolov8n.pt
# 3. compute visual_score
# 4. write graph metadata`}</pre>
              </div>
              <div className="how-media-copy">
                <h3>{track === 'user' ? 'Visual scoring is prepared in advance.' : 'Visual scoring is an offline backend job.'}</h3>
                <p>
                  {track === 'user'
                    ? 'The user benefits from visual scoring without waiting for AI processing during route requests.'
                    : 'The backend script fetches Mapillary images near graph edges, runs YOLOv8n detections, computes bounded visual scores, and saves those signals for later route requests.'}
                </p>
              </div>
            </article>
          </div>
        </section>

        <section id="backend" className="landing-section">
          <div className="landing-section-head" data-reveal>
            <span>{track === 'user' ? 'Support systems' : 'Backend details'}</span>
            <h2>{track === 'user' ? 'What powers the app behind the scenes.' : 'FastAPI endpoints and service boundaries.'}</h2>
            <p>
              {track === 'user'
                ? 'These backend pieces support routing, safety scoring, imagery integration, and emergency actions.'
                : 'These interfaces and services are the main backend touchpoints for integration and debugging.'}
            </p>
          </div>

          <div className="how-api-grid">
            {API_POINTS.map((point) => (
              <article key={point.path} className={`how-api-card ${track === 'developer' ? 'how-api-card-dev' : ''}`} data-reveal>
                <div className="how-api-heading">
                  <span>{point.method}</span>
                  <strong>{point.path}</strong>
                </div>
                <p>{point.summary}</p>
              </article>
            ))}
          </div>

          {track === 'developer' ? (
            <div className="how-demo-grid">
              {DEV_DEMOS.map((item) => (
                <article key={item.title} className="how-demo-card" data-reveal>
                  <span>{item.title}</span>
                  <p>{item.body}</p>
                  <a href={item.href} className="landing-secondary-link">
                    {item.cta}
                  </a>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="landing-section">
          <div className="landing-final-cta" data-reveal>
            <span>Documentation scope</span>
            <h2>{track === 'user' ? 'Use the product with confidence.' : 'Understand the system with precision.'}</h2>
            <p>
              {track === 'user'
                ? 'This view stays centered on features, actions, and route confidence.'
                : 'This view stays centered on implementation, ownership, and technical reasoning.'}
            </p>
            <div className="landing-actions landing-actions-center">
              <button type="button" className="landing-cta" onClick={() => onNavigate('/app')}>
                Launch ZENVOY
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
