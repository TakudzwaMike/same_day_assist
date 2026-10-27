import React, { Component, ErrorInfo, ReactNode } from 'react';
import logoImg from '../../assets/logo.png';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('sda_app_state');
      localStorage.removeItem('sda_access_token');
      localStorage.removeItem('sda_refresh_token');
      localStorage.removeItem('sda_user');
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0b132b',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <img
            src={logoImg}
            alt="Same Day Assist"
            style={{ width: '96px', height: '96px', marginBottom: '20px', borderRadius: '16px' }}
          />
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
            Same Day Assist
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '320px', marginBottom: '24px', lineHeight: 1.5 }}>
            An unexpected error occurred while loading this view. You can reload the application or reset cached state.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
              }}
            >
              Reload Application
            </button>
            <button
              onClick={this.handleResetCache}
              style={{
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Clear Cache & Reset
            </button>
          </div>
          {this.state.error && (
            <p style={{ marginTop: '24px', fontSize: '11px', color: '#64748b', maxWidth: '320px', wordBreak: 'break-all' }}>
              Error: {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
