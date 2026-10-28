import { Component, type ReactNode } from "react";
import WhatsAppButton from "./WhatsAppButton";

// Shows a friendly message instead of a blank page if a page crashes.
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="container section narrow">
        <h1>Sorry, something went wrong</h1>
        <p>Please reload the page. If it keeps happening, message us on WhatsApp and we'll help you directly.</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <WhatsAppButton />
        </div>
      </section>
    );
  }
}
