import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[LUMEN Error Boundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: 32, gap: 12,
        }}>
          <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6, fontFamily: 'monospace' }}>
            Error en {this.props.name || 'módulo'}
          </p>
          <code style={{ fontSize: 10, color: 'rgba(239,68,68,0.7)', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
            {this.state.error.message}
          </code>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 8, padding: '6px 16px', fontSize: 11, borderRadius: 4,
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lumen-border)',
              color: 'var(--lumen-text-muted)', cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
