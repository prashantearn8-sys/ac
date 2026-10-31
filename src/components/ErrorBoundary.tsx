import React from 'react';
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, OWNER_EMAIL } from '../data/acServices';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 text-[#191A23]">
          <div className="max-w-lg w-full bg-white border-2 border-[#191A23] rounded-3xl p-8 space-y-4 text-center">
            <h1 className="text-2xl font-display font-bold">
              Cool Bros AC Service — Direct Dispatch
            </h1>
            <p className="text-sm text-[#191A23]/80">
              Something went wrong while rendering this view. You can reach our Delhi &amp; Gurugram
              dispatch team directly or reload the page:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={CONTACT_PHONE_HREF}
                className="px-5 py-3 rounded-xl bg-[#191A23] text-white text-xs font-bold"
              >
                Call {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={`mailto:${OWNER_EMAIL}`}
                className="px-5 py-3 rounded-xl bg-[#7DD3FC] border border-[#191A23] text-[#191A23] text-xs font-bold"
              >
                Email {OWNER_EMAIL}
              </a>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-3 rounded-xl bg-white border border-[#191A23] text-[#191A23] text-xs font-bold cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
