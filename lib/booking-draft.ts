export type BookingSupplier = {
  name: string;
  pallets: number;
};

export type BookingDraft = {
  order_number: string;
  email: string;
  total_pallets: number;
  suppliers: BookingSupplier[];
};
