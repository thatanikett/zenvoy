import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Runtime error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
        }}>
          <div style={{
            width: 'min(640px, 100%)',
            background: 'var(--bg-surface)',
            border: '1px solid rgba(255, 68, 68, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: 'var(--shadow-panel)',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '10px',
            }}>
              Runtime error
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              marginBottom: '14px',
              lineHeight: 1.6,
            }}>
              The app hit a client-side exception. The message below should make the failure visible instead of dropping to a blank screen.
            </div>
            <pre style={{
              margin: 0,
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: '#ff9b9b',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
