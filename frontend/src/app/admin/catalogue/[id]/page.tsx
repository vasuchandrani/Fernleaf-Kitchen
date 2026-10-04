import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DishOptionsManager from '@/components/admin/DishOptionsManager';

export default async function DishDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dish, allOptions] = await Promise.all([
    api.get(`/catalogue/dishes/${id}`).catch(() => null),
    api.get('/catalogue/options?includeInactive=true').catch(() => []),
  ]);

  if (!dish) return <div>Dish not found</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Link href="/admin/catalogue" className="btn-secondary" style={{ marginBottom: '20px', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to catalogues
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dish configuration</p>
          <h1>{dish.name}</h1>
          <p className="page-subtitle">{dish.sku} · Manage the options available with this dish.</p>
        </div>
      </div>
      <DishOptionsManager dish={dish} initialOptions={allOptions} />
    </div>
  );
}
