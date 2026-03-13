export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);

  const date = searchParams.get("date");
  const pallets = Number(searchParams.get("pallets") || 0);

  const duration = pallets >= 15 ? 60 : 30;

  const slots = generateSlots(duration);

  return Response.json({
    date,
    duration,
    slots
  });

}

function generateSlots(duration: number) {

  const slots: string[] = [];

  let hour = 6;
  let minutes = 0;

  while (hour < 14 || (hour === 14 && minutes === 0)) {

    const h = String(hour).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");

    slots.push(`${h}:${m}`);

    minutes += duration === 60 ? 60 : 30;

    if (minutes === 60) {
      minutes = 0;
      hour += 1;
    }

  }

  return slots;

}