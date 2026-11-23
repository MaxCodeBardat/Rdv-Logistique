import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Requête invalide.' }, { status: 400 });
    }
    const status = body?.status;

    if (!['pending', 'done', 'no_show'].includes(status)) {
      return Response.json({ error: 'Statut invalide.' }, { status: 400 });
    }

    // ✅ IMPORTANT
    const params = await context.params;
    const id = params.id;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ error: 'Identifiant invalide.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    const session = await decrypt(token);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { error } = await getSupabaseAdmin()
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Appointment status update failed:', error.code);
      return Response.json({ error: 'Impossible de modifier le rendez-vous.' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Appointment status service unavailable:', err);
    return Response.json({ error: 'Service de rendez-vous indisponible.' }, { status: 503 });
  }
}
