// src/app/dashboard/form-schema.ts

import { z } from "zod";

export const shipmentSchema = z.object({
  NAMA: z.string({ required_error: "Nama wajib dipilih." }).min(1, "Nama wajib dipilih."),
  TANGGAL: z.date({ required_error: "Tanggal wajib diisi." }),
  SHIPMENT: z.string().length(10, { message: "Shipment harus 10 digit." }),
  JUMLAH_TOKO: z.coerce.number().min(1, { message: "Jumlah toko minimal 1." }),
  TERKIRIM: z.coerce.number().min(0, { message: "Terkirim tidak boleh negatif." }),
  ALASAN: z.string().optional(),
}).refine((data) => data.TERKIRIM <= data.JUMLAH_TOKO, {
  message: "Jumlah terkirim tidak boleh melebihi jumlah toko.",
  path: ["TERKIRIM"],
}).refine((data) => {
  const gagal = data.JUMLAH_TOKO - data.TERKIRIM;
  if (gagal > 0) {
    return data.ALASAN && data.ALASAN.length > 0;
  }
  return true;
}, {
  message: "Alasan wajib diisi jika ada pengiriman yang gagal.",
  path: ["ALASAN"],
});