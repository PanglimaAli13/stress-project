// src/app/dashboard/columns.tsx

"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

// Definisikan tipe data Shipment dengan tambahan rowIndex
export type Shipment = {
    rowIndex: number; // <-- PERBAIKAN DITAMBAHKAN DI SINI
    'SUBMIT ID': string
    'SUBMIT DATE': string
    'NIK': string
    'NAMA': string
    'TANGGAL': string
    'SHIPMENT': number
    'JUMLAH TOKO': number
    'TERKIRIM': number
    'GAGAL': number
    'ALASAN': string
}

export const columns: ColumnDef<Shipment>[] = [
  // Kolom NAMA (akan ditampilkan secara kondisional di halaman utama)
  {
    accessorKey: "NAMA",
    header: "Nama Driver",
  },
  // Kolom TANGGAL dengan fitur sorting
  {
    accessorKey: "TANGGAL",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tanggal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "SHIPMENT",
    header: "Shipment",
  },
  {
    accessorKey: "JUMLAH TOKO",
    header: "Jumlah Toko",
  },
  {
    accessorKey: "TERKIRIM",
    header: "Terkirim",
  },
  {
    accessorKey: "GAGAL",
    header: "Gagal",
  },
  {
    accessorKey: "ALASAN",
    header: "Alasan",
  },
  // Kolom Aksi untuk tombol Edit/Delete
  {
    id: "actions",
    cell: ({ row }) => {
      const shipment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(shipment["SUBMIT ID"])}>
              Salin Submit ID
            </DropdownMenuItem>
            {/* Aksi Edit dan Delete akan ditangani oleh state di page.tsx */}
            <DropdownMenuItem>Edit Data</DropdownMenuItem>
            <DropdownMenuItem className="text-red-500">Hapus Data</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
