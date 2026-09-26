import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SurakshaAR Boot Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="p-6 bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-md space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto font-black text-2xl">
              🛡️
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">SurakshaAR Simulator Mode</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                The simulator encountered a temporary device initialization state. Tap below to launch directly in 3D Virtual mode.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left overflow-x-auto max-h-32">
                <span className="text-[10px] font-mono font-bold text-amber-400 block mb-1">Diagnostic Detail:</span>
                <pre className="text-[10px] font-mono text-red-300 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-xl transition-all"
              >
                Reload SurakshaAR Simulator
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch (e) {}
                  this.setState({ hasError: false, error: null });
                  window.location.href = window.location.origin + '?mode=virtual';
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700"
              >
                Reset App & Force 3D Virtual Mode
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
