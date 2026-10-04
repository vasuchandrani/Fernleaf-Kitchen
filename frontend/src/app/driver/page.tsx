'use client';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, CheckCircle, Camera, Edit3, X } from 'lucide-react';
import Link from 'next/link';

export default function DriverDashboard() {
  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDrop, setActiveDrop] = useState<any | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDrops();
  }, []);

  const fetchDrops = async () => {
    try {
      const d = new Date();
      // For local testing, ensure date matches db seeded date. Since we didn't specify date in seed, it uses today.
      const date = d.toISOString().split('T')[0];
      const res = await fetch(`/api/proxy/dispatch/driver/drops?date=${date}`);
      const data = await res.json();
      setDrops(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrop) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proxy/dispatch/driver/drops/${activeDrop.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      if (res.ok) {
        setActiveDrop(null);
        setNote('');
        fetchDrops();
      } else {
        const err = await res.json();
        alert(err.message || 'Error completing delivery');
      }
    } catch {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="admin-theme" style={{ minHeight: '100vh', padding: '16px', maxWidth: '600px', margin: '0 auto', background: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', fontSize: '1.5rem' }}>Driver Route</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date().toLocaleDateString()}</p>
        </div>
        <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', padding: '8px', background: '#e2e8f0', borderRadius: '8px' }}>Log out</Link>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div className="premium-card" style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Remaining</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{drops.filter(o => o.status !== 'DELIVERED').length}</p>
        </div>
        <div className="premium-card" style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Delivered</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{drops.filter(o => o.status === 'DELIVERED').length}</p>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Today&apos;s Drops</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {drops.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>No drops assigned today.</p>
        ) : (
          drops.map(drop => {
            const isDelivered = drop.status === 'DELIVERED';
            const companyName = drop.orders?.[0]?.employee?.company?.name || 'Company Drop';
            const address = drop.orders?.[0]?.employee?.company?.addresses?.find((a: any) => a.id === drop.addressId) || drop.orders?.[0]?.employee?.company?.addresses?.[0];
            const items = drop.orders?.reduce((sum: number, o: any) => sum + o.lines?.reduce((s: number, l: any) => s + l.quantity, 0), 0) || 0;

            return (
              <div key={drop.id} className="premium-card" style={{ 
                padding: '20px', 
                opacity: isDelivered ? 0.6 : 1,
                borderLeft: isDelivered ? '4px solid #10b981' : (drop.status === 'OUT_FOR_DELIVERY' ? '4px solid #3b82f6' : '4px solid #eab308')
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>{companyName}</h4>
                  <span style={{ fontWeight: 'bold', color: isDelivered ? '#10b981' : '#3b82f6' }}>{drop.deliveryTime}</span>
                </div>
                <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  {address?.label || address?.address || 'Delivery Address'}
                </p>
                
                <div style={{ padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                  <p><strong>Status:</strong> {drop.status}</p>
                  <p><strong>Items:</strong> {items} meals</p>
                </div>

                {!isDelivered ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                      <Navigation size={16} /> Map
                    </button>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: drop.status === 'OUT_FOR_DELIVERY' ? 1 : 0.5 }} disabled={drop.status !== 'OUT_FOR_DELIVERY'} onClick={() => setActiveDrop(drop)}>
                      <CheckCircle size={16} /> Deliver
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 500, justifyContent: 'center', padding: '8px' }}>
                    <CheckCircle size={16} /> Delivered at {drop.deliveredAt ? new Date(drop.deliveredAt).toLocaleTimeString() : 'unknown time'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {activeDrop && (
        <div className="glass-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Complete Delivery</h2>
              <button onClick={() => setActiveDrop(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleDeliver} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}><Edit3 size={14}/> Delivery Note (Optional)</label>
                <textarea 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className="input-field" 
                  rows={3} 
                  placeholder="e.g. Left at reception"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', cursor: 'pointer', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', justifyContent: 'center' }}>
                <Camera size={18} /> <span>Add Photo Evidence</span>
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '12px', marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                {submitting ? 'Saving...' : 'Confirm Delivery'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
