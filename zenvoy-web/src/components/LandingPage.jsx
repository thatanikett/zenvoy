import { useEffect } from 'react'
import heroImage from '../assets/hero.png'
import LandingMapPreview from './LandingMapPreview'

const NAV_ITEMS = [
  { href: '#signals', label: 'Signals' },
  { href: '/how-it-works', label: 'How it works', route: true },
  { href: '#evidence', label: 'Evidence' },
  { href: '#launch', label: 'Launch' },
]

const FEATURE_CARDS = [
  {
    eyebrow: 'Safer Routing',
    title: 'Compare safest vs fastest before you leave.',
    body: 'ZENVOY scores route choices using lighting, crime signals, visibility, and AI-generated route reasoning.',
  },
  {
    eyebrow: 'Mapillary Layer',
    title: 'Inspect signs, objects, and street context on demand.',
    body: 'Traffic signs, points, and street objects can be filtered directly on the map for faster environmental review.',
  },
  {
    eyebrow: 'Street Verification',
    title: 'Open nearby imagery right from the route canvas.',
    body: 'Tap the map to inspect the closest available Mapillary scene without leaving the decision flow.',
  },
  {
    eyebrow: 'Escalation',
    title: 'Keep SOS one tap away during active navigation.',
    body: 'A dedicated emergency action stays available inside the live experience for quick access under stress.',
  },
]

const WORKFLOW_STEPS = [
  {
    index: '01',
    title: 'Set the journey',
    body: 'Choose a source and destination inside Delhi, then request the route comparison.',
  },
  {
    index: '02',
    title: 'Audit the tradeoff',
    body: 'Review safest vs fastest with route scores, visual edges, lighting coverage, and incident signals.',
  },
  {
    index: '03',
    title: 'Verify the street',
    body: 'Open street-view evidence, inspect map data overlays, and confirm the route before moving.',
  },
]

const METRICS = [
  { value: '2 routes', label: 'Compared live for every search' },
  { value: '4 layers', label: 'Safety, signs, objects, and imagery in one flow' },
  { value: '1 tap', label: 'From route decision to SOS escalation' },
]

export default function LandingPage({ onLaunchApp, onNavigate }) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.16 })

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-shell">
      <div className="landing-noise" />
      <header className="landing-nav">
        <div className="landing-nav-group">
          <a href="#top" className="landing-brand">
            <span className="landing-brand-mark">
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 7L7 13L1 7L7 1Z" stroke="#10161d" strokeWidth="1.5" />
                <circle cx="7" cy="7" r="2" fill="#10161d" />
              </svg>
            </span>
            <span>
              <strong>ZENVOY</strong>
              <small>Delhi safety mesh</small>
            </span>
          </a>
          <div className="landing-nav-status">
            <span className="landing-nav-status-dot" />
            Route intelligence live
          </div>
        </div>

        <nav className="landing-links" aria-label="Section navigation">
          {NAV_ITEMS.map((item) => (
            item.route ? (
              <button
                key={item.href}
                type="button"
                className="landing-nav-button"
                onClick={() => onNavigate(item.href)}
              >
                {item.label}
              </button>
            ) : (
              <a key={item.href} href={item.href}>{item.label}</a>
            )
          ))}
        </nav>

        <div className="landing-nav-actions">
          <a href="#workflow" className="landing-secondary-link landing-secondary-link-nav">
            Workflow
          </a>
          <button type="button" className="landing-cta landing-cta-small" onClick={onLaunchApp}>
            Launch App
          </button>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero landing-grid">
          <div className="landing-copy" data-reveal>
            <span className="landing-kicker">After-dark navigation for real urban decisions</span>
            <h1>Choose routes with evidence, not instinct.</h1>
            <p>
              ZENVOY helps people compare the safest and fastest paths using route scoring,
              incident-aware reasoning, Mapillary street context, and on-map visual verification.
            </p>
            <div className="landing-actions">
              <button type="button" className="landing-cta" onClick={onLaunchApp}>
                Open Live Map
              </button>
              <a href="#workflow" className="landing-secondary-link">
                See how it works
              </a>
            </div>
            <div className="landing-metrics">
              {METRICS.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-visual" data-reveal>
            <LandingMapPreview />
          </div>
        </section>

        <section id="signals" className="landing-section">
          <div className="landing-section-head" data-reveal>
            <span>Signal stack</span>
            <h2>One operating surface for route judgment.</h2>
            <p>
              The product is designed to move from route selection to street verification without
              forcing users into separate tools or disconnected tabs.
            </p>
          </div>

          <div className="landing-feature-grid">
            {FEATURE_CARDS.map((card, index) => (
              <article
                key={card.title}
                className="landing-feature-card"
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <span>{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="landing-section landing-workflow">
          <div className="landing-section-head" data-reveal>
            <span>Workflow</span>
            <h2>A short decision loop built for pressure.</h2>
            <p>
              Every stage reduces ambiguity fast: set the journey, compare the tradeoff, then inspect the street before moving.
            </p>
          </div>

          <div className="landing-timeline">
            {WORKFLOW_STEPS.map((step, index) => (
              <article
                key={step.index}
                className="landing-timeline-step"
                data-reveal
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <span>{step.index}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="evidence" className="landing-section landing-evidence">
          <div className="landing-evidence-panel" data-reveal>
            <div className="landing-evidence-copy">
              <span>Field evidence</span>
              <h2>Map data that explains why a route should feel safer.</h2>
              <p>
                Filter sign families, inspect objects, and open the closest available imagery
                directly from the same route canvas. The interface keeps decision context intact.
              </p>
              <ul className="landing-evidence-list">
                <li>Mapillary sign and object filters aligned with the live route view</li>
                <li>On-map street-view opening for fast environmental verification</li>
                <li>AI analysis panel that keeps route reasoning visible beside the map</li>
              </ul>
            </div>
            <div className="landing-evidence-stack">
              <div className="landing-evidence-shell">
                <img src={heroImage} alt="ZENVOY interface detail" />
              </div>
              <div className="landing-insight-chip">Street-view dock</div>
              <div className="landing-insight-chip landing-insight-chip-alt">Map data filters</div>
            </div>
          </div>
        </section>

        <section id="launch" className="landing-section">
          <div className="landing-final-cta" data-reveal>
            <span>Ready to test the flow</span>
            <h2>Open the live map and run a route comparison.</h2>
            <p>
              Use the production interface to search routes, inspect safety analysis, and validate the street before committing.
            </p>
            <div className="landing-actions landing-actions-center">
              <button type="button" className="landing-cta" onClick={onLaunchApp}>
                Launch ZENVOY
              </button>
              <a href="#top" className="landing-secondary-link">
                Back to top
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
