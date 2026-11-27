'use client';

import { addDays, format } from 'date-fns';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BadgeCheck } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { useBookingDraft } from '@/components/BookingDraftProvider';

export default function DisponibilitesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Chargement des disponibilités...
        </div>
      }
    >
      <DisponibilitesContent />
    </Suspense>
  );
}

function DisponibilitesContent() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      label: format(date, 'EEEE d MMM'),
    };
  });

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const dayButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { bookingDraft, clearBookingDraft } = useBookingDraft();
  const pallets = bookingDraft?.total_pallets ?? 0;
  const appointmentDuration = pallets >= 15 ? 60 : 30;
  const [slots, setSlots] = useState<string[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [loadingDays, setLoadingDays] = useState(true);
  const [availableDays, setAvailableDays] = useState<
    { date: Date; label: string; slots: string[] }[]
  >([]);
  const fetchDaysWithAvailability = async () => {
    setLoadingDays(true);
    const results = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const formattedDate = date.toISOString().split('T')[0];

      const res = await fetch(
        `/api/availability?date=${formattedDate}&pallets=${pallets}`
      );

      const data = await res.json();

      if (data.slots.length > 0) {
        results.push({
          date,
          label: format(date, 'EEEE d MMM', { locale: fr }),
          slots: data.slots,
        });
      }
    }

    setAvailableDays(results);
    setLoadingDays(false);
  };
  useEffect(() => {
    if (!bookingDraft) return;
    fetchDaysWithAvailability();
  }, [bookingDraft]);
  const fetchAvailability = async (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];

    const res = await fetch(
      `/api/availability?date=${formattedDate}&pallets=${pallets}`
    );

    const data = await res.json();

    setSlots(data.slots);
  };
  const formattedDate = selectedDay
    ? format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr }).replace(
        /^\w/,
        (c) => c.toUpperCase()
      )
    : '';
  const formattedTime = selectedSlot ? selectedSlot.replace(':', 'h') : '';
  const bookAppointment = async () => {
    if (!selectedDay || !selectedSlot || !bookingDraft) return;

    setBookingLoading(true);

    const date = selectedDay.toISOString().split('T')[0];

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          start_time: selectedSlot,
          duration: appointmentDuration,
          ...bookingDraft,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        clearBookingDraft();
        setBookingSuccess(true);
        fetchAvailability(selectedDay);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la réservation');
      }
    } catch {
      setErrorMessage('Le service de réservation est momentanément indisponible. Réessayez.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="w-full min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          {/* ✅ Icône */}
          <BadgeCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />

          {/* Titre */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Rendez-vous confirmé
          </h2>

          {/* Texte */}
          <p className="text-gray-600 mb-6">
            Votre créneau a bien été réservé.
          </p>

          {/* 📋 (optionnel mais FORTEMENT recommandé) */}
          <div className="bg-gray-100 rounded-xl p-4 text-left text-sm mb-6 space-y-2">
            <p>
              <span className="text-gray-500">Date : {formattedDate}</span>
            </p>
            <p>
              <span className="text-gray-500">Horaire : {formattedTime}</span>
            </p>
            <p>
              <span className="text-gray-500">Palettes : {pallets}</span>
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Retour au formulaire
          </button>
        </div>
      </div>
    );
  }

  if (!bookingDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 text-center text-white">
        <p>Informations de réservation introuvables. Veuillez revenir au formulaire.</p>
      </div>
    );
  }

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
              Veuillez sélectionner un jour afin de consulter les créneaux
              disponibles pour votre livraison.
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
              {loadingDays ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {availableDays.map((day, index) => {
                    const isOpen =
                      selectedDay?.toDateString() === day.date.toDateString();

                    return (
                      <div
                        key={index}
                        className="border border-black rounded-md overflow-hidden"
                      >
                        {/* Bouton jour */}
                        <button
                          ref={(el) => {
                            dayButtonRefs.current[index] = el;
                          }}
                          onClick={() => {
                            if (
                              selectedDay?.toDateString() ===
                              day.date.toDateString()
                            ) {
                              setSelectedDay(null);
                            } else {
                              setSelectedDay(day.date);
                              setSlots(day.slots); // 🔥 important
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 text-black hover:bg-gray-50 transition"
                        >
                          <span>{day.label}</span>

                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Créneaux */}
                        <div
                          className={`transition-all duration-300 overflow-hidden ${
                            isOpen ? 'max-h-96 p-4 pt-0' : 'max-h-0'
                          }`}
                        >
                          <div className="grid grid-cols-3 gap-2">
                            {slots.map((slot) => (
                              <button
                                key={slot}
                                onClick={() => {
                                  setErrorMessage(null);
                                  setSelectedSlot(
                                    selectedSlot === slot ? null : slot
                                  );
                                }}
                                className={`cursor-pointer border border-black rounded-md py-2 transition
                                                ${selectedSlot === slot ? 'bg-black text-white' : 'text-black hover:bg-gray-50'}
                                            `}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          {slots.length === 0 && (
                            <p className="text-sm text-gray-500 mt-2">
                              Aucun créneau disponible pour ce jour.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {selectedSlot && (
                    <div className="mt-4 flex flex-col items-end gap-2">
                      {errorMessage && (
                        <p className="text-red-500 text-sm">{errorMessage}</p>
                      )}

                      <button
                        onClick={bookAppointment}
                        disabled={bookingLoading}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition"
                      >
                        {bookingLoading ? 'Réservation...' : 'Confirmer le RDV'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
