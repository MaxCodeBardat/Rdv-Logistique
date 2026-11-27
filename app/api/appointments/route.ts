import { getSupabaseAdmin } from '@/lib/supabase';

type AppointmentRequest = {
  date?: unknown;
  start_time?: unknown;
  order_number?: unknown;
  email?: unknown;
  total_pallets?: unknown;
  suppliers?: unknown;
};

type SupplierInput = { name: string; pallets: number };

export async function POST(request: Request) {
  let body: AppointmentRequest;

  try {
    body = (await request.json()) as AppointmentRequest;
  } catch {
    return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { date, start_time: selectedSlot, order_number, email, total_pallets, suppliers } = body;

  if (typeof date !== 'string' || !isValidDate(date)) {
    return Response.json({ error: 'Date invalide.' }, { status: 400 });
  }

  if (typeof selectedSlot !== 'string' || !isValidSlot(selectedSlot)) {
    return Response.json({ error: 'Créneau invalide.' }, { status: 400 });
  }

  if (
    typeof total_pallets !== 'number' ||
    !Number.isSafeInteger(total_pallets) ||
    total_pallets < 1
  ) {
    return Response.json({ error: 'Nombre de palettes invalide.' }, { status: 400 });
  }

  const orderNumber = typeof order_number === 'string' ? order_number.trim() : '';
  const contactEmail = typeof email === 'string' ? email.trim() : '';

  if (orderNumber.length < 1 || orderNumber.length > 100) {
    return Response.json({ error: 'Numéro de commande invalide.' }, { status: 400 });
  }

  if (
    contactEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
  ) {
    return Response.json({ error: 'Adresse email invalide.' }, { status: 400 });
  }

  if (!Array.isArray(suppliers) || suppliers.length < 1 || suppliers.length > 30) {
    return Response.json({ error: 'Liste de fournisseurs invalide.' }, { status: 400 });
  }

  const normalizedSuppliers: SupplierInput[] = [];
  for (const supplier of suppliers) {
    if (
      !supplier ||
      typeof supplier !== 'object' ||
      typeof supplier.name !== 'string' ||
      typeof supplier.pallets !== 'number' ||
      !Number.isSafeInteger(supplier.pallets) ||
      supplier.pallets < 1
    ) {
      return Response.json({ error: 'Répartition des fournisseurs invalide.' }, { status: 400 });
    }

    const name = supplier.name.trim();
    if (!name || name.length > 120) {
      return Response.json({ error: 'Nom de fournisseur invalide.' }, { status: 400 });
    }
    normalizedSuppliers.push({ name, pallets: supplier.pallets });
  }

  if (normalizedSuppliers.reduce((sum, supplier) => sum + supplier.pallets, 0) !== total_pallets) {
    return Response.json({ error: 'La répartition ne correspond pas au total de palettes.' }, { status: 400 });
  }

  const duration = total_pallets >= 15 ? 60 : 30;

  try {
    const { error } = await getSupabaseAdmin().from('appointments').insert({
      date,
      start_time: selectedSlot,
      duration,
      order_number: orderNumber,
      email: contactEmail,
      total_pallets,
      suppliers: normalizedSuppliers,
    });

    if (error) {
      if (error.code === '23P01') {
        return Response.json(
          { error: 'Ce créneau vient d’être réservé.' },
          { status: 409 }
        );
      }

      console.error('Appointment insert failed:', error.code);
      return Response.json({ error: 'Impossible de créer le rendez-vous.' }, { status: 500 });
    }

    return Response.json({ message: 'RDV créé' }, { status: 201 });
  } catch (error) {
    console.error('Appointment service unavailable:', error);
    return Response.json({ error: 'Service de réservation indisponible.' }, { status: 503 });
  }
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidSlot(value: string) {
  if (!/^(?:0[6-9]|1[0-3]):(?:00|30)$/.test(value)) return false;
  return true;
}
