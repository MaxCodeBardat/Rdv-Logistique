import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/session';
import { createSupabaseAuthClient } from '@/lib/supabase-auth';

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  try {
    const { data, error } = await createSupabaseAuthClient().auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error || !data.user || data.user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = await encrypt({
      userId: data.user.id,
      email: data.user.email ?? '',
      role: 'admin',
    });

    const cookieStore = await cookies();

    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (cause) {
    console.error('Admin authentication service unavailable:', cause);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
