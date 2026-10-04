import { api } from '@/lib/api';
import { MapPin } from 'lucide-react';
import AddStationDialog from '@/components/admin/AddStationDialog';

export default async function StationsPage() {
  const stations = await api.get('/catalogue/stations').catch(() => []);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
        <AddStationDialog />
      </div>

      {(!Array.isArray(stations) || stations.length === 0) ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <MapPin size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3>No Stations defined</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Create routing stations like &quot;Hot Line&quot; or &quot;Salad Station&quot; to organize kitchen prep.</p>
        </div>
      ) : (
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', background: 'var(--bg-light)' }}>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', width: '80px' }}>ID</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Station Name</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((st: any) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>#{st.id}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{st.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
