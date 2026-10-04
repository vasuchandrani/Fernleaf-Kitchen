'use server';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatusAction(prevState: any, formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const status = formData.get('status') as string;

  try {
    await api.patch(`/orders/${orderId}/status`, { status });
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath(`/admin/orders`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
