"use client";

import { addDays, format } from "date-fns";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function DisponibilitesPage() {

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      label: format(date, "EEEE d MMM"),
    };
  });

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const searchParams = useSearchParams();
  const pallets = Number(searchParams.get("palettes") || 0);  
  const appointmentDuration = pallets >= 15 ? 60 : 30;
  const [slots, setSlots] = useState<string[]>([]);
  const fetchAvailability = async (date: Date) => {

    const formattedDate = date.toISOString().split("T")[0];

    const res = await fetch(
        `/api/availability?date=${formattedDate}&pallets=${pallets}`
    );

    const data = await res.json();

    setSlots(data.slots);

    };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans pt-15 px-6">
      <main className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Prise de rendez-vous pour Livraison Transporteur
          </h1>

          <div className="mt-2 pt-5">
            <p className="text-gray-600 dark:text-gray-300">
              Veuillez sélectionner un jour afin de consulter les créneaux disponibles pour votre livraison.
            </p>
          </div>
        </div>

        <p className="text-gray-600">
            Durée estimée du rendez-vous : {appointmentDuration} minutes
        </p>

        {/* Card disponibilités */}
        <div className="pt-7">
          <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg space-y-4">

            <h2 className="text-center text-2xl font-bold text-gray-800 mb-4">
              Choisir un jour
            </h2>

            <div className="space-y-2">
              {days.map((day, index) => {
                const isOpen = selectedDay?.toDateString() === day.date.toDateString();

                    return (
                        <div key={index} className="border border-black rounded-md overflow-hidden">

                            {/* Bouton jour */}
                            <button
                                onClick={() => {
                                setSelectedDay(day.date);
                                fetchAvailability(day.date);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 text-black hover:bg-gray-50 transition"
                            >
                                <span>{day.label}</span>

                                <ChevronDown
                                size={18}
                                className={`transition-transform duration-300 ${
                                    isOpen ? "rotate-180" : ""
                                }`}
                                />
                            </button>

                            {/* Créneaux */}
                            <div
                                className={`transition-all duration-300 overflow-hidden ${
                                isOpen ? "max-h-96 p-4 pt-0" : "max-h-0"
                                }`}
                            >
                                <div className="grid grid-cols-3 gap-2">
                                    {slots.map((slot) => (
                                        <button
                                        key={slot}
                                        className="border border-black rounded-md py-2 text-black hover:bg-gray-50 transition"
                                        >
                                        {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}