import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only relax checks in development
  if (process.env.NODE_ENV === 'development') {
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    // Allow localhost and 127.0.0.1 (any port)
    if (
      host.startsWith('localhost:') ||
      host.startsWith('127.0.0.1:') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return NextResponse.next();
    }
    // Optionally, log or allow all in dev:
    // return NextResponse.next();
    return new NextResponse('Forbidden (dev host/origin check)', { status: 403 });
  }
  // In production, do nothing (or add stricter checks)
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/sound-effects', '/'],
};
