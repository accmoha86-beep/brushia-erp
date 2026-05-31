'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Users,
  Shield,
  Key,
  UserPlus,
  Settings,
  Check,
  X,
  Edit,
  Trash2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Search,
  Building,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Permission {
  id: string;
  name: string;
  module: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface LocalUser {
  id: string;
  displayName: string;
  email: string;
  roles: Role[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS = ['Users', 'Roles', 'Permissions Matrix'] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  Users: <Users size={16} />,
  Roles: <Shield size={16} />,
  'Permissions Matrix': <Key size={16} />,
};

const ROLE_COLORS: Record<string, string> = {
  'Super Admin': 'bg-red-500/20 text-red-400 border-red-500/30',
  Manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Cashier: 'bg-green-500/20 text-green-400 border-green-500/30',
  'Warehouse Staff': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Accountant: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const ROLE_DOT: Record<string, string> = {
  'Super Admin': 'bg-red-400',
  Manager: 'bg-blue-400',
  Cashier: 'bg-green-400',
  'Warehouse Staff': 'bg-amber-400',
  Accountant: 'bg-purple-400',
};

function roleBadgeClass(name: string) {
  return ROLE_COLORS[name] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function roleDotClass(name: string) {
  return ROLE_DOT[name] ?? 'bg-gray-400';
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function UsersPage() {
  const { t, locale, isRTL } = useI18n();
  const [tab, setTab] = useState<Tab>('Users');

  /* shared data */
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRolesAndPerms = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        api.get<Role[]>('/rbac/roles'),
        api.get<Permission[]>('/rbac/permissions'),
      ]);
      setRoles(r);
      setPermissions(p);
    } catch (e) {
      console.error('Failed to load roles / permissions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesAndPerms();
  }, [fetchRolesAndPerms]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <Shield size={22} className="text-rose-400" />
            </div>
            User &amp; Role Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Manage users, roles, and access permissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50',
            )}
          >
            {TAB_ICONS[t]}
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-700 border-t-rose-500" />
        </div>
      ) : (
        <>
          {tab === 'Users' && (
            <UsersTab roles={roles} onRefresh={fetchRolesAndPerms} />
          )}
          {tab === 'Roles' && (
            <RolesTab
              roles={roles}
              permissions={permissions}
              onRefresh={fetchRolesAndPerms}
            />
          )}
          {tab === 'Permissions Matrix' && (
            <PermissionsMatrixTab roles={roles} permissions={permissions} />
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB 1 — Users                                                     */
/* ================================================================== */

function UsersTab({
  roles,
  onRefresh,
}: {
  roles: Role[];
  onRefresh: () => Promise<void>;
}) {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<LocalUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /* Create‐user modal state */
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  /* Role‐edit modal state */
  const [editRoleModal, setEditRoleModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function handleCreate() {
    setError('');
    if (!form.displayName || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post<any>('/auth/register', {
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        tenantId: undefined,
      });
      const userId = res?.id ?? res?.user?.id ?? res?.userId;
      let assignedRoles: Role[] = [];
      if (form.roleId && userId) {
        await api.post<any>(`/rbac/users/${userId}/roles`, {
          roleId: form.roleId,
        });
        const matchedRole = roles.find((r) => r.id === form.roleId);
        if (matchedRole) assignedRoles = [matchedRole];
      }
      setUsers((prev) => [
        ...prev,
        {
          id: userId ?? crypto.randomUUID(),
          displayName: form.displayName,
          email: form.email,
          roles: assignedRoles,
        },
      ]);
      setForm({ displayName: '', email: '', password: '', roleId: '' });
      setShowModal(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function handleEditRole() {
    if (!editingUser) return;
    try {
      // Remove existing roles
      for (const r of editingUser.roles) {
        await api.delete(`/rbac/users/${editingUser.id}/roles/${r.id}`);
      }
      // Assign new role
      let newRoles: Role[] = [];
      if (selectedRoleId) {
        await api.post<any>(`/rbac/users/${editingUser.id}/roles`, {
          roleId: selectedRoleId,
        });
        const matchedRole = roles.find((r) => r.id === selectedRoleId);
        if (matchedRole) newRoles = [matchedRole];
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, roles: newRoles } : u,
        ),
      );
      setEditRoleModal(false);
      setEditingUser(null);
    } catch (e) {
      console.error('Failed to update role', e);
    }
  }

  function handleRemoveUser(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search users…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 w-72"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={16} />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                Email
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                Roles
              </th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-gray-500">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No users yet</p>
                  <p className="text-sm mt-1">
                    Click &quot;Create User&quot; to add the first user
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300 uppercase">
                        {u.displayName.charAt(0)}
                      </div>
                      <span className="font-medium">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-gray-600 italic">
                          No role assigned
                        </span>
                      ) : (
                        u.roles.map((r) => (
                          <span
                            key={r.id}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                              roleBadgeClass(r.name),
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                roleDotClass(r.name),
                              )}
                            />
                            {r.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setSelectedRoleId(u.roles[0]?.id ?? '');
                          setEditRoleModal(true);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        title="Edit Role"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleRemoveUser(u.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Create New User">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
                placeholder="e.g. Ahmed Hassan"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="ahmed@brushia.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Minimum 8 characters"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Assign Role
              </label>
              <select
                value={form.roleId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, roleId: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                <option value="">— No role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                ) : (
                  <UserPlus size={15} />
                )}
                {creating ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {editRoleModal && editingUser && (
        <Modal
          onClose={() => {
            setEditRoleModal(false);
            setEditingUser(null);
          }}
          title={`Edit Role — ${editingUser.displayName}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Select Role
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                <option value="">— No role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setEditRoleModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditRole}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Check size={15} />
                Save Role
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB 2 — Roles                                                     */
/* ================================================================== */

function RolesTab({
  roles,
  permissions,
  onRefresh,
}: {
  roles: Role[];
  permissions: Permission[];
  onRefresh: () => Promise<void>;
}) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(
    new Set(),
  );
  const [saving, setSaving] = useState(false);

  /* group permissions by module */
  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      const mod = p.module || 'general';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    },
    {},
  );
  const modules = Object.keys(grouped).sort();

  function openPermEditor(role: Role) {
    setEditingRole(role);
    setSelectedPermIds(new Set(role.permissions.map((p) => p.id)));
  }

  function togglePerm(id: string) {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(mod: string) {
    const modPerms = grouped[mod];
    const allSelected = modPerms.every((p) => selectedPermIds.has(p.id));
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      modPerms.forEach((p) => {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      });
      return next;
    });
  }

  async function savePermissions() {
    if (!editingRole) return;
    setSaving(true);
    try {
      await api.put<any>(`/rbac/roles/${editingRole.id}/permissions`, {
        permissionIds: Array.from(selectedPermIds),
      });
      await onRefresh();
      setEditingRole(null);
    } catch (e) {
      console.error('Failed to save permissions', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3">
        {roles.map((role) => {
          const isExpanded = expandedRole === role.id;
          return (
            <div
              key={role.id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Role Header */}
              <button
                onClick={() =>
                  setExpandedRole(isExpanded ? null : role.id)
                }
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      role.name === 'Super Admin'
                        ? 'bg-red-500/20'
                        : role.name === 'Manager'
                          ? 'bg-blue-500/20'
                          : role.name === 'Cashier'
                            ? 'bg-green-500/20'
                            : role.name === 'Warehouse Staff'
                              ? 'bg-amber-500/20'
                              : role.name === 'Accountant'
                                ? 'bg-purple-500/20'
                                : 'bg-gray-800',
                    )}
                  >
                    <Shield
                      size={18}
                      className={cn(
                        role.name === 'Super Admin'
                          ? 'text-red-400'
                          : role.name === 'Manager'
                            ? 'text-blue-400'
                            : role.name === 'Cashier'
                              ? 'text-green-400'
                              : role.name === 'Warehouse Staff'
                                ? 'text-amber-400'
                                : role.name === 'Accountant'
                                  ? 'text-purple-400'
                                  : 'text-gray-400',
                      )}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{role.name}</div>
                    <div className="text-sm text-gray-400">
                      {role.description || 'No description'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">
                    {role.permissions.length} permission
                    {role.permissions.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-500" />
                  )}
                </div>
              </button>

              {/* Expanded Permission List */}
              {isExpanded && (
                <div className="border-t border-gray-800 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-400">
                      Assigned Permissions
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPermEditor(role);
                      }}
                      className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors"
                    >
                      <Settings size={14} />
                      Edit Permissions
                    </button>
                  </div>
                  {role.permissions.length === 0 ? (
                    <p className="text-sm text-gray-600 italic py-2">
                      No permissions assigned to this role.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {role.permissions.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2 text-sm"
                        >
                          <Check size={13} className="text-green-400 shrink-0" />
                          <span className="text-gray-300 truncate">
                            {p.name}
                          </span>
                          <span className="ml-auto text-[10px] text-gray-600 uppercase tracking-wider shrink-0">
                            {p.module}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Permissions Editor Modal */}
      {editingRole && (
        <Modal
          onClose={() => setEditingRole(null)}
          title={`Edit Permissions — ${editingRole.name}`}
          wide
        >
          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {modules.map((mod) => {
              const modPerms = grouped[mod];
              const allChecked = modPerms.every((p) =>
                selectedPermIds.has(p.id),
              );
              const someChecked =
                !allChecked &&
                modPerms.some((p) => selectedPermIds.has(p.id));
              return (
                <div
                  key={mod}
                  className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(mod)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0',
                        allChecked
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : someChecked
                            ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                            : 'border-gray-600 text-transparent',
                      )}
                    >
                      {(allChecked || someChecked) && <Check size={12} />}
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                      {mod}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {modPerms.filter((p) => selectedPermIds.has(p.id))
                        .length}
                      /{modPerms.length}
                    </span>
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-4 pb-3">
                    {modPerms.map((p) => {
                      const checked = selectedPermIds.has(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-700/40 cursor-pointer transition-colors"
                        >
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              togglePerm(p.id);
                            }}
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer',
                              checked
                                ? 'bg-rose-500 border-rose-500 text-white'
                                : 'border-gray-600',
                            )}
                          >
                            {checked && <Check size={10} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-gray-200 truncate">
                              {p.name}
                            </div>
                            {p.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {p.description}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700/50">
            <span className="text-sm text-gray-400">
              {selectedPermIds.size} of {permissions.length} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                disabled={saving}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                ) : (
                  <Check size={15} />
                )}
                {saving ? 'Saving…' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB 3 — Permissions Matrix                                        */
/* ================================================================== */

function PermissionsMatrixTab({
  roles,
  permissions,
}: {
  roles: Role[];
  permissions: Permission[];
}) {
  const [searchQuery, setSearchQuery] = useState('');

  /* Group permissions by module */
  const grouped = permissions.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      const mod = p.module || 'general';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    },
    {},
  );
  const modules = Object.keys(grouped).sort();

  /* Build lookup: roleId → set of permissionIds */
  const rolePermMap = new Map<string, Set<string>>();
  roles.forEach((r) => {
    rolePermMap.set(r.id, new Set(r.permissions.map((p) => p.id)));
  });

  const filteredModules = searchQuery
    ? modules.filter(
        (mod) =>
          mod.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grouped[mod].some((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : modules;

  return (
    <div>
      {/* Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search permissions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 w-72"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-rose-500/20 flex items-center justify-center">
              <Check size={10} className="text-rose-400" />
            </div>
            Granted
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center">
              <X size={10} className="text-gray-600" />
            </div>
            Denied
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3 sticky left-0 bg-gray-900 z-10 min-w-[200px]">
                  Permission
                </th>
                {roles.map((r) => (
                  <th
                    key={r.id}
                    className="text-center text-xs font-medium uppercase tracking-wider px-4 py-3 min-w-[110px]"
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border',
                        roleBadgeClass(r.name),
                      )}
                    >
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((mod) => (
                <>
                  {/* Module header row */}
                  <tr key={`mod-${mod}`} className="bg-gray-800/30">
                    <td
                      colSpan={roles.length + 1}
                      className="px-6 py-2 sticky left-0"
                    >
                      <div className="flex items-center gap-2">
                        <Lock size={12} className="text-gray-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          {mod}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          ({grouped[mod].length})
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Permission rows */}
                  {grouped[mod]
                    .filter(
                      (p) =>
                        !searchQuery ||
                        p.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        mod
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((perm) => (
                      <tr
                        key={perm.id}
                        className="border-t border-gray-800/30 hover:bg-gray-800/20 transition-colors"
                      >
                        <td className="px-6 py-2.5 sticky left-0 bg-gray-900 z-10">
                          <div className="text-sm text-gray-300">
                            {perm.name}
                          </div>
                          {perm.description && (
                            <div className="text-xs text-gray-600 mt-0.5 max-w-xs truncate">
                              {perm.description}
                            </div>
                          )}
                        </td>
                        {roles.map((r) => {
                          const has = rolePermMap.get(r.id)?.has(perm.id);
                          return (
                            <td key={r.id} className="text-center px-4 py-2.5">
                              {has ? (
                                <div className="mx-auto w-6 h-6 rounded bg-rose-500/20 flex items-center justify-center">
                                  <Check
                                    size={13}
                                    className="text-rose-400"
                                  />
                                </div>
                              ) : (
                                <div className="mx-auto w-6 h-6 rounded bg-gray-800 flex items-center justify-center">
                                  <X
                                    size={13}
                                    className="text-gray-700"
                                  />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </>
              ))}
              {filteredModules.length === 0 && (
                <tr>
                  <td
                    colSpan={roles.length + 1}
                    className="text-center py-12 text-gray-500"
                  >
                    <Key size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No matching permissions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shared Modal Component                                             */
/* ================================================================== */

function Modal({
  onClose,
  title,
  wide,
  children,
}: {
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cn(
          'relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 mx-4',
          wide ? 'w-full max-w-2xl' : 'w-full max-w-md',
        )}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
