import { useState } from 'react';
import { callProtectedApi } from './api.ts';
import type { DemoUser } from './UserSwitcher.tsx';

interface Endpoint {
  label: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
}

const ENDPOINTS: Endpoint[] = [
  { label: 'List projects', method: 'GET', path: '/api/projects', description: 'Requires projects.tasks.view.all' },
  { label: 'Create project', method: 'POST', path: '/api/projects', description: 'Requires projects.tasks.create.all' },
  { label: 'List invoices', method: 'GET', path: '/api/billing/invoices', description: 'Requires billing.invoices.view.all' },
  { label: 'Admin stats', method: 'GET', path: '/api/admin/stats', description: 'Requires admin.panel.view.all' },
];

interface ProtectedApiPanelProps {
  currentUser: DemoUser;
}

export function ProtectedApiPanel({ currentUser }: ProtectedApiPanelProps) {
  const [results, setResults] = useState<Record<string, { status: number; body: string }>>({});

  const call = async (endpoint: Endpoint) => {
    try {
      const res = await callProtectedApi(endpoint.path, currentUser.id, {
        method: endpoint.method,
      });
      const body = await res.text();
      setResults((prev) => ({
        ...prev,
        [endpoint.path + endpoint.method]: { status: res.status, body },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [endpoint.path + endpoint.method]: { status: 0, body: String(error) },
      }));
    }
  };

  return (
    <div className="api-panel">
      {ENDPOINTS.map((endpoint) => {
        const key = endpoint.path + endpoint.method;
        const result = results[key];
        return (
          <div key={key} className="api-row">
            <div className="api-info">
              <span className={`method method-${endpoint.method.toLowerCase()}`}>
                {endpoint.method}
              </span>
              <code>{endpoint.path}</code>
              <span className="muted small">{endpoint.description}</span>
            </div>
            <button onClick={() => call(endpoint)}>Try it</button>
            {result && (
              <div className={`api-result api-result-${result.status >= 200 && result.status < 300 ? 'ok' : 'deny'}`}>
                <strong>{result.status}</strong> {truncate(result.body, 120)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}
