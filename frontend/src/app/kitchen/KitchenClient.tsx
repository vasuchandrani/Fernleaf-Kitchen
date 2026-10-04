'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Flame, Loader2, Utensils, type LucideIcon } from 'lucide-react';

type KitchenStatus = 'NOT_STARTED' | 'STARTED' | 'DONE';
type Combo = {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  kitchenStatus?: KitchenStatus;
  options?: { optionName: string }[];
};
const orderDateInput = (value: string) => value.slice(0, 10);
type Line = {
  id: number;
  dishName: string;
  unitPrice: number;
  combinations?: Combo[];
  kitchenStation?: { id: number; name: string } | null;
};
type Order = {
  id: number;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  employee?: { company?: { name: string }; firstName?: string; lastName?: string };
  lines?: Line[];
};

const toDateInput = (value: Date) => {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
};
const money = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

export default function KitchenClient({ initialOrders, activeTab = 'dashboard' }: { initialOrders: Order[]; activeTab?: 'dashboard' | 'orders' }) {
  const [selectedDate, setSelectedDate] = useState(toDateInput(new Date()));
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [station, setStation] = useState('all');
  const [status, setStatus] = useState<'all' | KitchenStatus>('all');
  const [search, setSearch] = useState('');
  const [loadingCombo, setLoadingCombo] = useState<number | null>(null);
  const [error, setError] = useState('');
  const isToday = selectedDate === toDateInput(new Date());
  useEffect(() => {
    let cancelled = false;
    setLoadingOrders(true);
    fetch(`/api/proxy/orders?status=CONFIRMED&deliveryDate=${selectedDate}`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Could not load confirmed orders.');
        return response.json();
      })
      .then(data => {
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const confirmedOrders = useMemo(
    () => orders.filter(order => order.status === 'CONFIRMED'),
    [orders],
  );
  const stations = useMemo(() => {
    const values = confirmedOrders.flatMap(order => order.lines?.map(line => line.kitchenStation?.name ?? 'Unassigned station') ?? []);
    return [...new Set(values)];
  }, [confirmedOrders]);
  const rows = useMemo(() => confirmedOrders.flatMap(order => (order.lines ?? []).flatMap(line =>
    (line.combinations ?? []).map(combo => ({ order, line, combo })),
  )).filter(({ order, line, combo }) => {
    const text = `${order.id} ${order.employee?.company?.name ?? ''} ${line.dishName}`.toLowerCase();
    return (station === 'all' || line.kitchenStation?.name === station)
      && (status === 'all' || (combo.kitchenStatus ?? 'NOT_STARTED') === status)
      && text.includes(search.toLowerCase());
  }), [confirmedOrders, search, station, status]);

  const totals = rows.reduce((result, row) => {
    const key = row.combo.kitchenStatus ?? 'NOT_STARTED';
    result.total += row.combo.quantity;
    result[key] += row.combo.quantity;
    return result;
  }, { total: 0, NOT_STARTED: 0, STARTED: 0, DONE: 0 });

  const updateStatus = async (orderId: number, comboId: number, current: KitchenStatus = 'NOT_STARTED') => {
    const next = current === 'NOT_STARTED' ? 'STARTED' : 'DONE';
    setLoadingCombo(comboId);
    setError('');
    try {
      const response = await fetch(`/api/proxy/orders/${orderId}/combinations/${comboId}/kitchen-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitchenStatus: next }),
      });
      if (!response.ok) throw new Error((await response.text()) || 'Could not update the kitchen status.');
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the kitchen status.');
    } finally {
      setLoadingCombo(null);
    }
  };

  return (
    <>
      <section className="premium-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '6px', minWidth: '190px' }}>
            <span className="field-label">Service date</span>
            <input className="input-field" type="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)} />
          </label>
          {loadingOrders && <Loader2 size={17} className="spin" aria-label="Loading confirmed orders" />}
        </div>
      </section>

      {activeTab === 'dashboard' ? (
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {([
              { label: 'Confirmed orders', value: confirmedOrders.length, Icon: Utensils },
              { label: 'Prep units', value: totals.total, Icon: Flame },
              { label: 'Preparing', value: totals.STARTED, Icon: Clock3 },
              { label: 'Ready for packing', value: totals.DONE, Icon: CheckCircle2 },
            ] as { label: string; value: number; Icon: LucideIcon }[]).map(({ label, value, Icon }) => (
              <div className="premium-card" key={String(label)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                  <Icon size={18} /><span>{label}</span>
                </div>
                <strong style={{ display: 'block', fontSize: '2rem', marginTop: '12px' }}>{value}</strong>
              </div>
            ))}
          </div>
          <div className="premium-card">
            <h2 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>Station workload</h2>
            {confirmedOrders.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No confirmed orders for this date.</p> : stations.map(name => {
              const count = rows.filter(row => row.line.kitchenStation?.name === name).reduce((sum, row) => sum + row.combo.quantity, 0);
              return <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}><span>{name}</span><strong>{count} units</strong></div>;
            })}
          </div>
        </section>
      ) : (
        <section>
          <div className="premium-card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <input className="input-field" placeholder="Search order, company, or dish" value={search} onChange={event => setSearch(event.target.value)} style={{ flex: '1 1 240px' }} />
              <select className="input-field" value={station} onChange={event => setStation(event.target.value)}><option value="all">All stations</option>{stations.map(value => <option key={value}>{value}</option>)}</select>
              <select className="input-field" value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="all">All preparation states</option><option value="NOT_STARTED">Not started</option><option value="STARTED">Preparing</option><option value="DONE">Ready for packing</option></select>
            </div>
          </div>
          {error && <div role="alert" style={{ color: '#b42318', marginBottom: '14px' }}>{error}</div>}
          <div style={{ display: 'grid', gap: '12px' }}>
            {loadingOrders ? <div className="premium-card"><p style={{ color: 'var(--text-muted)' }}>Loading confirmed orders…</p></div> : rows.length === 0 ? <div className="premium-card"><p style={{ color: 'var(--text-muted)' }}>No confirmed orders match these filters.</p></div> : rows.map(({ order, line, combo }) => {
              const current = combo.kitchenStatus ?? 'NOT_STARTED';
              return <article className="premium-card" key={combo.id} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                  <div><strong>{line.dishName}</strong><div style={{ color: 'var(--text-muted)', fontSize: '.82rem', marginTop: '4px' }}>{order.employee?.company?.name ?? 'Company'} · Order #{order.id} · {order.deliveryTime}</div></div>
                  <strong>{money(combo.totalPrice)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '.86rem' }}>{combo.quantity} units · {line.kitchenStation?.name ?? 'Unassigned station'} · {combo.options?.map(option => option.optionName).join(', ') || 'Standard'}</span>
                  {isToday && current !== 'DONE' ? <button className="primary-button" disabled={loadingCombo === combo.id} onClick={() => updateStatus(order.id, combo.id, current)}>{loadingCombo === combo.id ? <Loader2 size={16} className="spin" /> : current === 'STARTED' ? 'Ready for packing' : 'Start preparing'}</button> : <span className="filter-chip active">{current === 'DONE' ? 'Ready for packing' : current === 'STARTED' ? 'Preparing' : 'Not started'}</span>}
                </div>
              </article>;
            })}
          </div>
        </section>
      )}
    </>
  );
}
