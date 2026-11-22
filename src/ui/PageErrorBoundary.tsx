import { Component, type ReactNode } from 'react';

export function PageLoadError() {
  return <div className="container">
    <p role="alert">This page could not load.</p>
    <button className="button secondary" type="button" onClick={() => window.location.reload()}>Reload page</button>
  </div>;
}

type Props = { children: ReactNode; fallback: ReactNode; route: string };
type State = { failed: boolean; route: string };

export class PageErrorBoundary extends Component<Props, State> {
  state = { failed: false, route: this.props.route };

  static getDerivedStateFromProps(props: Props, state: State) {
    return props.route === state.route ? null : { failed: false, route: props.route };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
