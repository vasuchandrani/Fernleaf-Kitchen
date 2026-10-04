'use client';
import { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Clock, CheckCircle, Package, AlertTriangle, User, ChefHat, Box, ArrowRight } from 'lucide-react';

interface Drop {
  id: number;
  companyName: string;
  addressId: number;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  driverId: number | null;
  driver: { id: number, name: string } | null;
  orderCount: number;
  totalMeals: number;
  totalCombinations: number;
  completedCombinations: number;
  isReady: boolean;
  deliveredAt?: string;
  onTime?: boolean;
}

export default function DispatchPage() {
  const [date, setDate] = useState('');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split('T')[0]);
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (date) fetchDrops();
  }, [date]);

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/proxy/dispatch/drivers');
      if (res.ok) setDrivers(await res.json());
    } catch {}
  };

  const fetchDrops = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/dispatch/drops?date=${date}`);
      const data = await res.json();
      setDrops(Array.isArray(data) ? data : []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/proxy/dispatch/drops/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Error updating status');
      }
      fetchDrops();
    } catch {}
  };

  const assignDriver = async (id: number, driverId: number) => {
    try {
      await fetch(`/api/proxy/dispatch/drops/${id}/driver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId })
      });
      fetchDrops();
    } catch {}
  };

  const waiting = drops.filter(d => d.status === 'WAITING_ON_KITCHEN');
  const ready = drops.filter(d => d.status === 'READY_TO_LEAVE');
  const out = drops.filter(d => d.status === 'OUT_FOR_DELIVERY');
  const delivered = drops.filter(d => d.status === 'DELIVERED');
  const noDriver = ready.filter(d => !d.driverId);

  const SummaryCard = ({ title, count, subtext }: { title: string, count: number, subtext?: string }) => (
    <div style={{ flex: 1, minWidth: '160px', background: '#ffffff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{count}</div>
      {subtext && <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '8px' }}>{subtext}</div>}
    </div>
  );

  const renderCard = (drop: Drop) => {
    const isLate = false; // Add real logic if needed
    
    let badgeColor = '#94a3b8', badgeBg = '#f1f5f9', icon = null;
    if (drop.status === 'READY_TO_LEAVE') { badgeColor = '#7e22ce'; badgeBg = '#f3e8ff'; icon = <Package size={14} />; }
    if (drop.status === 'OUT_FOR_DELIVERY') { badgeColor = '#2563eb'; badgeBg = '#dbeafe'; icon = <Truck size={14} />; }
    if (drop.status === 'DELIVERED') { badgeColor = '#16a34a'; badgeBg = '#dcfce7'; icon = <CheckCircle size={14} />; }

    return (
      <div key={drop.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{drop.deliveryTime}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>delivery time</div>
          </div>
          {drop.status !== 'WAITING_ON_KITCHEN' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: badgeBg, color: badgeColor, padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
              {icon}
              {drop.status === 'READY_TO_LEAVE' ? 'Ready to leave' : drop.status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : 'Delivered'}
            </div>
          )}
        </div>

        {isLate && drop.status === 'READY_TO_LEAVE' && (
          <div style={{ background: '#ffedd5', color: '#c2410c', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
            Leave-by 13:00 passed
          </div>
        )}

        <div style={{ marginTop: '4px' }}>
          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.05rem' }}>{drop.companyName}</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
             {drop.addressId ? 'Delivery Address' : 'No Address'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            {drop.orderCount} order{drop.orderCount !== 1 && 's'} • {drop.totalMeals} meal{drop.totalMeals !== 1 && 's'}
          </div>
        </div>

        {drop.status === 'DELIVERED' && drop.deliveredAt && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#0f172a' }}>Delivered {new Date(drop.deliveredAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            {drop.onTime ? (
               <div style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, display: 'inline-block', marginTop: '4px' }}>On time</div>
            ) : (
               <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, display: 'inline-block', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <AlertTriangle size={12}/> Late delivery
               </div>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
          {drop.status === 'WAITING_ON_KITCHEN' && (
             <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>
                Kitchen Prep: {drop.completedCombinations} / {drop.totalCombinations}
             </div>
          )}

          {drop.status !== 'DELIVERED' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select 
                value={drop.driverId || ''} 
                onChange={e => assignDriver(drop.id, Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', color: '#0f172a', appearance: 'none', background: '#f8fafc' }}
              >
                <option value="" disabled>Select Driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              
              {drop.status === 'WAITING_ON_KITCHEN' && drop.isReady && (
                <button onClick={() => updateStatus(drop.id, 'READY_TO_LEAVE')} style={{ width: '100%', padding: '10px', background: '#7e22ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Mark Packed
                </button>
              )}
              {drop.status === 'READY_TO_LEAVE' && (
                <button disabled={!drop.driverId} onClick={() => updateStatus(drop.id, 'OUT_FOR_DELIVERY')} style={{ width: '100%', padding: '10px', background: drop.driverId ? '#15803d' : '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: drop.driverId ? 'pointer' : 'not-allowed' }}>
                  <Truck size={18} /> Mark out for delivery
                </button>
              )}
              {drop.status === 'OUT_FOR_DELIVERY' && (
                <button onClick={() => updateStatus(drop.id, 'DELIVERED')} style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <CheckCircle size={18} /> Mark Delivered
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{drop.driver?.name || 'Unknown Driver'}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Optional: Add a top bar if layout doesn't provide it */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Dispatch Portal</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Manage drops, coordinate delivery runs, and monitor drivers.</p>
          </div>
          <a href="/api/auth/logout" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>Logout</a>
        </div>
        
        {/* Summary Strip */}
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          <SummaryCard title="DROPS" count={drops.length} />
          <SummaryCard title="WAITING ON KITCHEN" count={waiting.length} subtext="drops waiting for food" />
          <SummaryCard title="READY TO LEAVE" count={ready.length} />
          <SummaryCard title="OUT FOR DELIVERY" count={out.length} />
          <SummaryCard title="DELIVERED" count={delivered.length} subtext={`${delivered.filter(d => d.onTime).length} on time`} />
          <SummaryCard title="NO DRIVER" count={noDriver.length} subtext="ready, unassigned" />
        </div>

        {/* Board Columns */}
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', alignItems: 'flex-start' }}>
          
          {/* Waiting on kitchen */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ChefHat size={20} color="#0f172a" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Waiting on kitchen</h3>
                <span style={{ background: '#e2e8f0', color: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>{waiting.length}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>Orders still being cooked. They become a drop when ready.</p>
            </div>
            
            {waiting.length === 0 ? (
              <div style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '32px 24px', textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                Every confirmed order is kitchen-ready.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {waiting.map(renderCard)}
              </div>
            )}
          </div>

          {/* Ready to leave */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Box size={20} color="#7e22ce" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Ready to leave</h3>
                <span style={{ background: '#e2e8f0', color: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>{ready.length}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>Packed and awaiting a driver for delivery.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ready.map(renderCard)}
            </div>
          </div>

          {/* Out for delivery */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Truck size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Out for delivery</h3>
                <span style={{ background: '#e2e8f0', color: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>{out.length}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>Currently in transit to the customer.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {out.map(renderCard)}
            </div>
          </div>

          {/* Delivered */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CheckCircle size={20} color="#16a34a" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Delivered</h3>
                <span style={{ background: '#e2e8f0', color: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>{delivered.length}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>Only the driver can deliver.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {delivered.map(renderCard)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
