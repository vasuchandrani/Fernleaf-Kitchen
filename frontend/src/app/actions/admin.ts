'use server';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function createCompanyAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const billingEmail = formData.get('billingEmail') as string;

  try {
    await api.post('/companies', { name, billingEmail });
    revalidatePath('/admin/companies');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
