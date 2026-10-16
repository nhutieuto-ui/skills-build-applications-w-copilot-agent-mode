import { useEffect, useState, type ReactNode } from 'react';

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: T };

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  loadData: () => Promise<T>;
  isEmpty: (data: T) => boolean;
  children: (data: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, emptyMessage, loadData, isEmpty, children }: Props<T>) {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    loadData()
      .then((data) => {
        if (active) setState({ status: 'loaded', data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const detail = error instanceof Error ? error.message : 'Unknown error';
        setState({ status: 'error', message: `Unable to load ${title.toLowerCase()}: ${detail}` });
      });

    return () => {
      active = false;
    };
  }, [loadData, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state.status === 'error' && <p role="alert">{state.message}</p>}
        {state.status === 'loaded' && (isEmpty(state.data)
          ? <p>{emptyMessage}</p>
          : children(state.data))}
      </div>
    </section>
  );
}
