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
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl max-w-md space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto font-black text-xl">
              🛡️
            </div>
            <h2 className="text-lg font-black text-white">SurakshaAR Safety Simulator</h2>
            <p className="text-xs text-slate-300">
              The application encountered a startup notice. Tap below to launch the simulator.
            </p>
            {this.state.error && (
              <div className="text-[10px] text-amber-300 font-mono bg-slate-900 p-2 rounded text-left overflow-auto max-h-24 border border-amber-500/20">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-xl active:scale-95 transition-transform"
            >
              Launch SurakshaAR
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
