import { Settings as SettingsIcon, User, MapPin } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import SettingsForm from './SettingsForm';
import PricingTiersClient from './PricingTiersClient';
import AddStationDialog from '@/components/admin/AddStationDialog';
import RolesClient from './RolesClient';
import { Shield } from 'lucide-react';

export default async function SettingsPage() {
  const [me, settings, tiers, stations, roles, permissions] = await Promise.all([
    api.get('/auth/me').catch(() => null),
    api.get('/settings').catch(() => ({})),
    api.get('/pricing/tiers').catch(() => []),
    api.get('/catalogue/stations').catch(() => []),
    api.get('/settings/roles').catch(() => []),
    api.get('/settings/permissions').catch(() => [])
  ]);

  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Settings</h1>
          <p className="page-subtitle">System configuration and account details.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="premium-card">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Account Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Email</label>
              <input type="text" disabled value={me?.email || 'Not available'} className="input-field" style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Name</label>
              <input type="text" disabled value={me?.name || 'Not available'} className="input-field" style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Role</label>
              <input type="text" disabled value={me?.role?.name || me?.role || 'Not available'} className="input-field" style={{ opacity: 0.7 }} />
            </div>
          </div>
        </div>

        <div className="premium-card h-fit">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={18} /> Kitchen Configuration
          </h3>
          <SettingsForm initialSettings={settings} />
        </div>

        <div className="premium-card h-fit">
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Pricing Tiers
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Manage pricing adjustments applied to companies assigned to these tiers.
          </p>
          <PricingTiersClient tiers={tiers} />
        </div>

        <div className="premium-card h-fit">
          <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} /> Access Control
          </h3>
          <RolesClient initialRoles={roles} initialPermissions={permissions} />
        </div>

        <div className="premium-card h-fit">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MapPin size={18} /> Kitchen stations
            </h3>
            <AddStationDialog />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Shared reference data for the kitchen team.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!Array.isArray(stations) || stations.length === 0) ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                No Stations defined
              </div>
            ) : stations.map((st: any) => (
              <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 500 }}>{st.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{st.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
