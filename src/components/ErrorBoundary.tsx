import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message ?? 'Unknown error' }
  }

  componentDidCatch(error: Error) {
    console.error('Arcade error boundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal">
          <div className="fatal-card">
            <span className="fatal-icon" aria-hidden>
              🕹️
            </span>
            <h1>Arcade glitch!</h1>
            <p>Something went wrong while you were playing. Your points are safe and saved.</p>
            <details className="fatal-details">
              <summary>Technical details</summary>
              <code>{this.state.message}</code>
            </details>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.location.assign('/')}
              >
                Back to games
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
