import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>, method: string) {
  const { path } = await params;
  if (!API_URL) {
    return NextResponse.json({ message: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });
  }
  const fullPath = path.join('/');
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchOptions: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = await request.text();
  }

  const url = `${API_URL}/${fullPath}${request.nextUrl.search}`;
  const res = await fetch(url, fetchOptions);

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, 'POST');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params, 'DELETE');
}
