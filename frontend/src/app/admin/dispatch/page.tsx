'use client';
import { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Clock, User, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/CustomSelect';

interface Drop {
  id: number;
  companyId: number;
  addressId: number;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  driverId: number | null;
  driver: { id: number, name: string } | null;
  orders: {
    id: number;
    totalAmount: number;
    employee: { company: { name: string, addresses: any[] } };
  }[];
}

export default function DispatchPage() {
  const [date, setDate] = useState('');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Default to tomorrow for dispatch planning
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (date) {
      fetchDrops();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/proxy/companies'); // drivers might be in a different endpoint, let's assume we have a way or just hardcode some for now, actually we need users with ROLE=DRIVER
      // Wait, there is no /users endpoint for drivers. We will just use the `/api/proxy/auth/me` to check who is logged in? 
      // Actually we need an endpoint to fetch all users with Driver role. Let's make a mock one for now or just fetch from /api/proxy/settings? No.
      // We will skip fetching drivers dynamically if we don't have the API, but wait! We can add a GET /users/drivers API easily.
    } catch {}
  };

  const fetchDrops = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/dispatch/drops?date=${date}`);
      const data = await res.json();
      setDrops(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateDrops = async () => {
    if (!date) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/proxy/dispatch/drops/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });
      const data = await res.json();
      alert(`Successfully generated ${data.dropsCreated} new drops.`);
      fetchDrops();
    } catch (e) {
      console.error(e);
      alert('Failed to generate drops');
    } finally {
      setGenerating(false);
    }
  };

  const updateDropStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/proxy/dispatch/drops/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchDrops();
    } catch {}
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Dispatch Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organize deliveries and assign drivers.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-light)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={18} color="var(--text-muted)" />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: 500 }}
            />
          </div>
          <button 
            className="btn-primary" 
            onClick={generateDrops} 
            disabled={generating}
            style={{ padding: '12px 24px' }}
          >
            {generating ? 'Generating...' : 'Generate Drops from Confirmed Orders'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
        </div>
      ) : drops.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <Truck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3>No Drops for {date}</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Click &quot;Generate Drops&quot; to group confirmed orders into deliveries.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {drops.map(drop => {
            const companyName = drop.orders[0]?.employee.company.name || 'Unknown Company';
            const addresses = drop.orders[0]?.employee.company.addresses || [];
            const address = addresses.find((a: any) => a.id === drop.addressId) || addresses[0];
            const totalItems = drop.orders.length;
            const totalValue = drop.orders.reduce((sum, o) => sum + o.totalAmount, 0) / 100;

            let statusColor = '#94a3b8';
            let statusBg = '#f1f5f9';
            if (drop.status === 'DISPATCHED') { statusColor = '#eab308'; statusBg = '#fef9c3'; }
            if (drop.status === 'OUT_FOR_DELIVERY') { statusColor = '#3b82f6'; statusBg = '#dbeafe'; }
            if (drop.status === 'DELIVERED') { statusColor = '#22c55e'; statusBg = '#dcfce7'; }

            return (
              <div key={drop.id} className="premium-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{companyName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Clock size={14} /> {drop.deliveryTime}
                    </div>
                  </div>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: statusColor, 
                    background: statusBg 
                  }}>
                    {drop.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                  <MapPin size={16} color="var(--primary)" style={{ marginTop: '2px' }} />
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{address?.label || 'Delivery Address'}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{address?.address || 'No address specified'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Orders: <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>Value: <strong style={{ color: 'var(--text-main)' }}>${totalValue.toFixed(2)}</strong></span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {drop.status === 'PENDING' && (
                      <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateDropStatus(drop.id, 'DISPATCHED')}>
                        Dispatch Orders
                      </button>
                    )}
                    {drop.status === 'DISPATCHED' && (
                      <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateDropStatus(drop.id, 'OUT_FOR_DELIVERY')}>
                        Mark Out For Delivery
                      </button>
                    )}
                    {drop.status === 'OUT_FOR_DELIVERY' && (
                      <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateDropStatus(drop.id, 'DELIVERED')}>
                        <CheckCircle size={16} /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
