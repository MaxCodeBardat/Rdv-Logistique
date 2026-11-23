import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const date = searchParams.get('date');
  const pallets = Number(searchParams.get('pallets') || 0);

  if (!date || !isValidDate(date) || !Number.isSafeInteger(pallets) || pallets < 1) {
    return Response.json({ error: 'Paramètres de disponibilité invalides.' }, { status: 400 });
  }

  const duration = pallets >= 15 ? 60 : 30;

  // récupérer les RDV existants
  try {
    const { data: appointments, error } = await getSupabaseAdmin()
      .from('appointments')
      .select('start_time, duration')
      .eq('date', date);

    if (error) {
      console.error('Availability query failed:', error.code);
      return Response.json({ error: 'Impossible de consulter les disponibilités.' }, { status: 500 });
    }

    const extended = false;

    const allSlots = generateSlots(extended);
    const futureSlots = removePastSlots(allSlots, date);
    const freeSlots = filterSlots(futureSlots, appointments ?? [], duration);
    const availableSlots = freeSlots;

    return Response.json({
      duration,
      slots: availableSlots,
    });
  } catch (error) {
    console.error('Availability service unavailable:', error);
    return Response.json({ error: 'Service de disponibilité indisponible.' }, { status: 503 });
  }
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function generateSlots(extended: boolean) {
  const slots: string[] = [];

  let hour = 6;
  let minutes = 0;

  const endHour = extended ? 17 : 14;

  while (hour < endHour || (hour === endHour && minutes === 0)) {
    const h = String(hour).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');

    slots.push(`${h}:${m}`);

    minutes += 30;

    if (minutes === 60) {
      minutes = 0;
      hour += 1;
    }
  }

  return slots;
}

function filterSlots(
  slots: string[],
  appointments: { start_time: string; duration: number }[],
  duration: number
) {
  return slots.filter((slot) => {
    const slotMinutes = toMinutes(slot);

    const conflict = appointments.some((appt) => {
      const start = toMinutes(appt.start_time);
      const end = start + appt.duration;

      const slotEnd = slotMinutes + duration;

      return slotMinutes < end && slotEnd > start;
    });

    return !conflict;
  });
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);

  return h * 60 + m;
}

function removePastSlots(slots: string[], date: string) {
  const now = new Date();

  return slots.filter((slot) => {
    const slotDateTime = new Date(date!);

    const [hours, minutes] = slot.split(':').map(Number);

    slotDateTime.setHours(hours);
    slotDateTime.setMinutes(minutes);
    slotDateTime.setSeconds(0);
    slotDateTime.setMilliseconds(0);

    return slotDateTime > now;
  });
}
