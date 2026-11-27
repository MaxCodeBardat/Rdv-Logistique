'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BookingDraft } from '@/lib/booking-draft';

type BookingDraftContextValue = {
  bookingDraft: BookingDraft | null;
  setBookingDraft: (draft: BookingDraft) => void;
  clearBookingDraft: () => void;
};

const BookingDraftContext = createContext<BookingDraftContextValue | null>(null);

export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);

  return (
    <BookingDraftContext.Provider
      value={{
        bookingDraft,
        setBookingDraft,
        clearBookingDraft: () => setBookingDraft(null),
      }}
    >
      {children}
    </BookingDraftContext.Provider>
  );
}

export function useBookingDraft() {
  const context = useContext(BookingDraftContext);
  if (!context) {
    throw new Error('useBookingDraft must be used within BookingDraftProvider.');
  }
  return context;
}
