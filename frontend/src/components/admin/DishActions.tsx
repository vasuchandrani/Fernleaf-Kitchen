'use client';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DishActions({ dishId }: { dishId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/catalogue/dishes/${dishId}/deactivate`, {
        method: 'PATCH',
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete dish');
      }
    } catch (e) {
      alert('Failed to delete dish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <button 
        onClick={() => router.push(`/admin/catalogue/${dishId}`)} 
        className="btn-secondary" 
        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
      >
        Options
      </button>
      <button 
        onClick={handleDelete}
        disabled={loading}
        style={{ background: 'none', border: '1px solid #fee2e2', borderRadius: '6px', color: '#ef4444', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
