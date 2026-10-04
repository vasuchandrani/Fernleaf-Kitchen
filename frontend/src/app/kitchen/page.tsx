import { api } from '@/lib/api';
import KitchenClient from './KitchenClient';

export default async function KitchenDashboard() {
  const orders = await api.get('/orders?status=CONFIRMED').catch(() => []);

  return <KitchenClient initialOrders={orders} />;
}
