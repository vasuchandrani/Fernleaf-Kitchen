import { api } from '@/lib/api';
import KitchenBoardClient from './KitchenBoardClient';

export default async function AdminKitchenPage() {
  const orders = await api.get('/orders').catch(() => []);
  
  return <KitchenBoardClient initialOrders={orders} />;
}
