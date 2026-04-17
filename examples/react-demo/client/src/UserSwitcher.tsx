export interface DemoUser {
  id: string;
  label: string;
  role: string;
}

export const DEMO_USERS: readonly DemoUser[] = [
  { id: 'user-viewer', label: 'Alice', role: 'Viewer' },
  { id: 'user-editor', label: 'Bob', role: 'Editor' },
  { id: 'user-admin', label: 'Carol', role: 'Admin' },
  { id: 'super-admin', label: 'Dana', role: 'Super Admin (bypass)' },
] as const;

interface UserSwitcherProps {
  current: DemoUser;
  onChange: (user: DemoUser) => void;
}

export function UserSwitcher({ current, onChange }: UserSwitcherProps) {
  return (
    <div className="user-switcher">
      <label htmlFor="user-select">Signed in as</label>
      <select
        id="user-select"
        value={current.id}
        onChange={(e) => {
          const next = DEMO_USERS.find((u) => u.id === e.target.value);
          if (next) onChange(next);
        }}
      >
        {DEMO_USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.label} — {user.role}
          </option>
        ))}
      </select>
    </div>
  );
}
