import { api } from '@/lib/api';
import { Tag } from 'lucide-react';
import AddOptionDialog from '@/components/admin/AddOptionDialog';

export default async function OptionsPage() {
  const options = await api.get('/catalogue/options').catch(() => []);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
        <AddOptionDialog />
      </div>

      {(!Array.isArray(options) || options.length === 0) ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Tag size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3>No Options yet</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Options are modifiers like &quot;Extra Chicken&quot; or &quot;Gluten Free Bread&quot; that can be added to dishes.</p>
        </div>
      ) : (
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', background: 'var(--bg-light)' }}>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Option Name</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Cost Price</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {options.map((opt: any) => (
                  <tr key={opt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{opt.name}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>${(opt.costPrice / 100).toFixed(2)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '6px', fontWeight: 600, background: opt.isActive ? '#d1fae5' : '#fef2f2', color: opt.isActive ? '#059669' : '#ef4444' }}>
                        {opt.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
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
