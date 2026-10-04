'use client';
import { useState } from 'react';
import { Shield, Plus, X } from 'lucide-react';

export default function RolesClient({ initialRoles, initialPermissions }: { initialRoles: any[], initialPermissions: any[] }) {
  const [roles, setRoles] = useState(initialRoles);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [isAdding, setIsAdding] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<any>(null);
  
  // Selected permissions state for the currently editing or adding role
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch('/api/proxy/settings/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          description: '',
          permissionIds: Array.from(selectedPerms)
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoles([...roles, data]);
      setIsAdding(false);
      setNewRoleName('');
      setSelectedPerms(new Set());
    } catch (e) {
      alert('Failed to add role');
    }
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    const perms = new Set<number>(role.permissions?.map((p: any) => p.permissionId) || []);
    setSelectedPerms(perms);
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    try {
      const res = await fetch(`/api/proxy/settings/roles/${editingRole.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionIds: Array.from(selectedPerms)
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoles(roles.map(r => r.id === editingRole.id ? data : r));
      setEditingRole(null);
      setSelectedPerms(new Set());
    } catch (e) {
      alert('Failed to update permissions');
    }
  };

  const togglePermission = (id: number) => {
    const newSet = new Set(selectedPerms);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPerms(newSet);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Define roles and check required permissions.
        </p>
        <button className="btn-secondary" onClick={() => setIsAdding(true)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
          <Plus size={14} /> Add Role
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {roles.map((r: any) => (
          <div key={r.id} style={{ padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>{r.name}</span>
              <button 
                onClick={() => handleEditRole(r)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Edit Perms
              </button>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              {r.permissions?.length || 0} permissions assigned
            </div>
          </div>
        ))}
      </div>

      {(isAdding || editingRole) && (
        <div className="glass-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '500px', padding: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} />
                {isAdding ? 'Add New Role' : `Edit Permissions: ${editingRole.name}`}
              </h3>
              <button onClick={() => { setIsAdding(false); setEditingRole(null); setSelectedPerms(new Set()); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {isAdding && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Role Name</label>
                <input 
                  type="text" 
                  value={newRoleName} 
                  onChange={e => setNewRoleName(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. MANAGER"
                />
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '2px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Select Permissions</label>
              {permissions.map((p: any) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-light)', padding: '8px', borderRadius: '6px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedPerms.has(p.id)} 
                    onChange={() => togglePermission(p.id)} 
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.action}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <button 
              className="btn-primary" 
              onClick={isAdding ? handleAddRole : handleSavePermissions} 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isAdding ? 'Create Role' : 'Save Permissions'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
