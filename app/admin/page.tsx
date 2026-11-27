'use client';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { createContext, forwardRef, useContext, useEffect, useState } from 'react';

const locales = { fr: fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const STATUS_LABELS: Record<string, string> = {
  pending: 'À venir',
  done: 'Effectué',
  no_show: 'Non honoré',
};

const AdminCalendarContext = createContext<{
  unlockedDays: string[];
  openSlotManager: (date: Date) => void;
}>({
  unlockedDays: [],
  openSlotManager: () => {},
});

const AdminDayColumnWrapper = forwardRef<HTMLDivElement, any>(
  function AdminDayColumnWrapper(
    { children, date, slotMetrics, className, style },
    ref
  ) {
    const { unlockedDays, openSlotManager } = useContext(AdminCalendarContext);
    const dayKey = format(date, 'yyyy-MM-dd');
    const isUnlocked = unlockedDays.includes(dayKey);
    const isWorkDay = date.getDay() >= 1 && date.getDay() <= 5;
    const rangeStart = new Date(date);
    rangeStart.setHours(14, 0, 0, 0);
    const rangeEnd = new Date(date);
    rangeEnd.setHours(17, 0, 0, 0);
    const range = slotMetrics.getRange(rangeStart, rangeEnd);

    return (
      <div ref={ref} className={className} style={style}>
        {children}
        <div className="rbc-admin-grid-lines" aria-hidden="true" />
        {isWorkDay && (
          <button
            type="button"
            aria-label={`${isUnlocked ? 'Bloquer' : 'Débloquer'} la plage de 14 h à 17 h le ${format(date, 'EEEE d MMMM yyyy', { locale: fr })}`}
            data-availability={isUnlocked ? 'open' : 'closed'}
            onClick={(event) => {
              event.stopPropagation();
              openSlotManager(date);
            }}
            className={`availability-lock absolute left-0 right-0 z-10 flex items-center justify-center transition-colors group ${
              isUnlocked
                ? 'border-0 bg-transparent hover:bg-transparent'
                : 'border-0 bg-gray-400/85 hover:bg-gray-500/90'
            }`}
            style={{ top: `${range.top}%`, height: `${range.height}%` }}
          >
            <span className="availability-lock-indicator relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md text-gray-800">
              <LockKeyhole aria-hidden="true" className="availability-lock-icon availability-lock-icon--closed" size={19} />
              <LockKeyholeOpen aria-hidden="true" className="availability-lock-icon availability-lock-icon--open" size={19} />
            </span>
          </button>
        )}
      </div>
    );
  }
);
AdminDayColumnWrapper.displayName = 'AdminDayColumnWrapper';

export default function AdminPage() {
  type Appointment = {
    id: string;
    date: string;
    start_time: string;
    duration: number;
    order_number: string;
    total_pallets: number;
    email: string;
    status: string;
    suppliers: { name: string; pallets: number }[];
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedDays, setUnlockedDays] = useState<string[]>([]);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'no_show'>(
    'all'
  );
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/appointments')
      .then((res) => res.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      });
  }, []);

  async function updateStatus(id: string, status: string) {
    setStatusError(null);
    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setStatusError('Impossible de mettre à jour le statut. Réessayez.');
        return;
      }
    } catch {
      setStatusError('Impossible de mettre à jour le statut. Réessayez.');
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    setSelectedAppointment((current) =>
      current?.id === id ? { ...current, status } : current
    );
  }

  if (loading) return <p className="p-6">Chargement...</p>;

  const calendarEvents = appointments.map((a) => {
    const start = new Date(`${a.date}T${a.start_time.slice(0, 5)}:00`);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + (a.duration || 30));
    return {
      id: a.id,
      title: a.suppliers?.length > 1 ? 'Multi-Fournisseur' : a.suppliers?.[0]?.name || 'Fournisseur non renseigné',
      start,
      end,
      status: a.status,
      raw: a,
    };
  });

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#e5e7eb';
    if (event.status === 'pending') backgroundColor = '#dbeafe';
    if (event.status === 'done') backgroundColor = '#bbf7d0';
    if (event.status === 'no_show') backgroundColor = '#fecaca';
    return {
      style: {
        backgroundColor,
        borderRadius: 0,
        border: 'none',
        color: '#111',
        padding: '1px',
      },
    };
  };

  const EventComponent = ({ event }: any) => (
    <div className="relative h-full min-h-0 w-full overflow-hidden text-center leading-tight">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1">
        <div className="w-full truncate text-[11px] font-semibold">
          {event.raw.suppliers?.length > 1 ? 'Multi-Fournisseur' : event.raw.suppliers?.[0]?.name || 'Fournisseur non renseigné'}
          {' · '}{event.raw.total_pallets} palettes
        </div>
        <div className="w-full truncate text-[10px] font-semibold">{format(event.start, "HH'h'mm")} – {format(event.end, "HH'h'mm")}</div>
      </div>
      <div className="absolute bottom-0 right-1 max-w-[90%] truncate text-[8px] font-normal leading-[9px]" title={`N° ${event.raw.order_number}`}>
        N° {event.raw.order_number}
      </div>
    </div>
  );

  const CustomToolbar = ({ label, onNavigate }: any) => (
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={() => onNavigate('PREV')}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        ←
      </button>
      <span className="font-semibold text-lg">{label}</span>
      <button
        onClick={() => onNavigate('NEXT')}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        →
      </button>
    </div>
  );

  return (
    <div className="p-6 pt-9 space-y-4 bg-gray-900">
      <h1 className="text-2xl font-semibold text-center">
        Calendrier des RDV transporteurs
      </h1>
      {calendarEvents.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          Aucun rendez-vous pour le moment
        </div>
      ) : (
        <div className="h-[700px] bg-gray-100 text-gray-600 p-4 rounded-lg">
          <AdminCalendarContext.Provider
            value={{
              unlockedDays,
              openSlotManager: setSelectedSlotDate,
            }}
          >
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={(event: any) => setSelectedAppointment(event.raw)}
              defaultView="work_week"
              views={['work_week']}
              eventPropGetter={eventStyleGetter}
              dayLayoutAlgorithm="no-overlap"
              culture="fr"
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: () => '',
                dayRangeHeaderFormat: ({ start, end }: any) =>
                  `${format(start, 'd')} - ${format(end, 'd MMMM', { locale: fr })}`,
                dayFormat: (date: Date) => format(date, 'EEEE d', { locale: fr }),
              }}
              components={{
                toolbar: CustomToolbar,
                event: EventComponent,
                dayColumnWrapper: AdminDayColumnWrapper,
              }}
              hiddenDays={[0, 6]}
              min={new Date(0, 0, 0, 6, 0, 0)}
              max={new Date(0, 0, 0, 17, 0, 0)}
              step={30}
              timeslots={1}
              weekStartsOn={1}
              date={currentDate}
              onNavigate={(newDate: Date) => setCurrentDate(newDate)}
              selectable
              onSelectSlot={(slotInfo: any) => {
                const hour = new Date(slotInfo.start).getHours();
                if (hour >= 14 && hour < 17) {
                  setSelectedSlotDate(slotInfo.start);
                }
              }}
            />
          </AdminCalendarContext.Provider>
        </div>
      )}

      {/* Popup pour les rendez-vous */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 bg-black/40 text-gray-600 flex items-center justify-center z-50"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="bg-gray-100 rounded-xl p-6 w-full max-w-md shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAppointment(null)}
              className="absolute top-3 right-3 bg-gray-200 rounded-full p-2 hover:bg-gray-300"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">
              Détail du rendez-vous
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Date :</strong>{' '}
                {format(
                  new Date(`${selectedAppointment.date}T12:00:00`),
                  'EEEE d MMMM yyyy',
                  { locale: fr }
                ).replace(/^\w/, (letter) => letter.toUpperCase())}
              </p>
              <p>
                <strong>Horaire :</strong> {format(new Date(`2000-01-01T${selectedAppointment.start_time.slice(0, 5)}:00`), "HH'h'mm")} – {format(new Date(new Date(`2000-01-01T${selectedAppointment.start_time.slice(0, 5)}:00`).getTime() + selectedAppointment.duration * 60_000), "HH'h'mm")}
              </p>
              <p>
                <strong>N° de Commande :</strong>{' '}
                {selectedAppointment.order_number}
              </p>
              <p>
                <strong>Nombre de Palettes :</strong>{' '}
                {selectedAppointment.total_pallets} palettes
              </p>
              <div>
                <strong>Fournisseur{selectedAppointment.suppliers?.length === 1 ? '' : 's'} :</strong>
                {selectedAppointment.suppliers?.length ? (
                  <ul className="ml-5 list-disc">
                    {selectedAppointment.suppliers.map((supplier, index) => (
                      <li key={`${supplier.name}-${index}`}>
                        {selectedAppointment.suppliers.length === 1
                          ? `${supplier.name} (${supplier.pallets} palettes)`
                          : `${supplier.name} — ${supplier.pallets} palettes`}
                      </li>
                    ))}
                  </ul>
                ) : <span> Non renseigné</span>}
              </div>
              <p>
                <strong>Contact :</strong> {selectedAppointment.email}
              </p>
              <p>
                <strong>Statut :</strong> {STATUS_LABELS[selectedAppointment.status] || selectedAppointment.status}
              </p>
            </div>
            {statusError && <p role="alert" className="mt-3 text-sm text-red-600">{statusError}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => updateStatus(selectedAppointment.id, 'done')}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                ✓ Effectué
              </button>
              <button
                onClick={() => updateStatus(selectedAppointment.id, 'no_show')}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ✕ Non honoré
              </button>
              <button
                onClick={() => updateStatus(selectedAppointment.id, 'pending')}
                className="group relative p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Réinitialiser le statut
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup pour les créneaux 14h-17h */}
      {selectedSlotDate && (
        <div
          className="fixed inset-0 bg-black/40 text-gray-600 flex items-center justify-center z-50"
          onClick={() => setSelectedSlotDate(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSlotDate(null)}
              className="absolute top-3 right-3 bg-gray-200 rounded-full p-2 hover:bg-gray-300"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">
              Gestion des créneaux
            </h2>
            <p className="text-center mb-6">
              {format(selectedSlotDate, 'EEEE d MMMM yyyy', { locale: fr })} :
              Plage de 14 h à 17 h
            </p>
            {(() => {
              const dayKey = format(selectedSlotDate, 'yyyy-MM-dd');
              const isUnlocked = unlockedDays.includes(dayKey);
              return (
                <button
                  onClick={() => {
                    if (isUnlocked) {
                      setUnlockedDays((prev) =>
                        prev.filter((d) => d !== dayKey)
                      );
                    } else {
                      setUnlockedDays((prev) => [...prev, dayKey]);
                    }
                    setSelectedSlotDate(null);
                  }}
                  className={`w-full py-2 rounded-lg text-white transition duration-200 ${
                    isUnlocked
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isUnlocked
                    ? 'Bloquer les créneaux'
                    : 'Débloquer les créneaux'}
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
