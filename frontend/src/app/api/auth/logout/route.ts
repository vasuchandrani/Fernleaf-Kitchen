import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL('/login', url.origin));
  
  response.cookies.set({
    name: 'token',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  response.cookies.set({
    name: 'role',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  return response;
}
