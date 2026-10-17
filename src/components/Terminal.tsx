import { lazy, Suspense, type ComponentProps } from 'react';

const LazyTerminal = lazy(() =>
  import('./TerminalPanel').then((module) => ({ default: module.TerminalPanel })),
);

// Keep the terminal renderer in its own chunk instead of the initial UI bundle.
export function TerminalPanel(props: ComponentProps<typeof LazyTerminal>) {
  return (
    <Suspense
      fallback={
        <div className="terminal-loading" role="status">
          Preparing your browser sandbox…
        </div>
      }
    >
      <LazyTerminal {...props} />
    </Suspense>
  );
}
