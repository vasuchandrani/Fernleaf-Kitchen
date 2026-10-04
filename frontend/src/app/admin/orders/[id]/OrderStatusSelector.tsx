'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/CustomSelect';
export default function OrderStatusSelector({ orderId, currentStatus }: { orderId: number; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const statuses = ['DRAFT', 'PLACED', 'CONFIRMED', 'COOKING', 'DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{ width: '200px' }}>
        <CustomSelect
          value={status}
          onChange={(v) => setStatus(v as string)}
          options={statuses.map(s => ({ value: s, label: s }))}
        />
      </div>
      <button className="btn-primary" disabled={loading || status === currentStatus} onClick={handleUpdate}>
        {loading ? 'Updating...' : 'Update'}
      </button>
    </div>
  );
}
