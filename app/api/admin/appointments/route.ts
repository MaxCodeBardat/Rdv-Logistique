import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET() {
  const token = (await cookies()).get('session')?.value;
  const session = await decrypt(token);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data;
  let error;

  try {
    ({ data, error } = await getSupabaseAdmin()
      .from('appointments')
      .select('id, date, start_time, duration, order_number, total_pallets, email, suppliers, status')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }));
  } catch (cause) {
    console.error('Admin appointments service unavailable:', cause);
    return NextResponse.json({ error: 'Service de rendez-vous indisponible.' }, { status: 503 });
  }

  if (error) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
