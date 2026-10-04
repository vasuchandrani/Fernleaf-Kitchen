import { api } from '@/lib/api';
import { MapPin, Navigation, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function DriverDashboard() {
  const orders = await api.get('/orders').catch(() => []);
  const myDrops = orders.filter((o: any) => 
    new Date(o.deliveryDate).toDateString() === new Date().toDateString() && 
    ['CONFIRMED', 'DELIVERED'].includes(o.status)
  );

  return (
    <div className="admin-theme" style={{ minHeight: '100vh', padding: '16px', maxWidth: '600px', margin: '0 auto', background: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', fontSize: '1.5rem' }}>Driver Route</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date().toLocaleDateString()}</p>
        </div>
        <Link href="/api/auth/logout" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', padding: '8px', background: '#e2e8f0', borderRadius: '8px' }}>Log out</Link>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div className="premium-card" style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Remaining</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{myDrops.filter((o: any) => o.status !== 'DELIVERED').length}</p>
        </div>
        <div className="premium-card" style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Delivered</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{myDrops.filter((o: any) => o.status === 'DELIVERED').length}</p>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Today&apos;s Drops</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {myDrops.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No drops assigned today.</p>
        ) : (
          myDrops.map((drop: any) => (
            <div key={drop.id} className="premium-card" style={{ 
              padding: '20px', 
              opacity: drop.status === 'DELIVERED' ? 0.6 : 1,
              borderLeft: drop.status !== 'DELIVERED' ? '4px solid #3b82f6' : '4px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1.1rem' }}>{drop.employee?.company?.name || 'Company Drop'}</h4>
                <span style={{ fontWeight: 'bold', color: drop.status === 'DELIVERED' ? '#10b981' : '#3b82f6' }}>{drop.deliveryTime}</span>
              </div>
              <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                {drop.address?.label || drop.address?.address || 'HQ'}
              </p>
              
              <div style={{ padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                <p><strong>Employee:</strong> {drop.employee?.name}</p>
                <p><strong>Items:</strong> {drop.lines?.reduce((sum: number, line: any) => sum + line.quantity, 0) || 1} boxed meals</p>
              </div>

              {drop.status !== 'DELIVERED' ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Navigation size={16} /> Navigate
                  </button>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    <CheckCircle size={16} /> Deliver
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 500, justifyContent: 'center', padding: '8px' }}>
                  <CheckCircle size={16} /> Delivered successfully
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
