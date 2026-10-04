'use server';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function createDishAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const temperature = formData.get('temperature') as string;
  const costPrice = parseInt(formData.get('costPrice') as string, 10) * 100; // Convert to cents
  const imageUrl = formData.get('imageUrl') as string; // Base64 string from hidden input

  try {
    await api.post('/catalogue/dishes', { 
      name, 
      sku, 
      temperature, 
      costPrice,
      imageUrl: imageUrl || undefined
    });
    revalidatePath('/admin/catalogue');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
