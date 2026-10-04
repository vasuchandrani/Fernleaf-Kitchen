import { Settings as SettingsIcon, User, MapPin } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import SettingsForm from './SettingsForm';
import PricingTiersClient from './PricingTiersClient';

export default async function SettingsPage() {
  const [me, settings, tiers] = await Promise.all([
    api.get('/auth/me').catch(() => null),
    api.get('/settings').catch(() => ({})),
    api.get('/pricing/tiers').catch(() => [])
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
          <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} /> Kitchen stations
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Keep routing data out of the catalogue view. Stations are shared reference data for the kitchen team.
          </p>
          <Link href="/admin/catalogue/stations" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Manage stations
          </Link>
        </div>
      </div>
    </div>
  );
}
