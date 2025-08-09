// src/app/dashboard/page.tsx

"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { CalendarDays, Package, CheckCircle, XCircle, Trophy, FilterX, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from "recharts";
import { DataTable } from "./DataTable";
import { Shipment } from "./columns";
import { InputShipmentForm } from "./InputShipmentForm";
import { EditShipmentForm } from "./EditShipmentForm";
import { shipmentSchema } from "./form-schema";
import { z } from "zod";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

// Tipe data untuk driver yang diambil
type DriverData = { nik: string; nama: string };
type RankingData = { nama: string; percTerkirim: string; percGagal: string; score: number };
// Tipe data untuk respons API yang diharapkan
type ApiResponse = { message: string; [key: string]: unknown };

const fetchApi = async (action: string, params?: Record<string, string | number>): Promise<unknown> => {
  let url = `${process.env.NEXT_PUBLIC_APPS_SCRIPT_URL}?action=${action}`;
  if (params) {
    for (const key in params) {
      url += `&${key}=${encodeURIComponent(params[key])}`;
    }
  }
  const res = await fetch(url);
  const result = await res.json();
  if (result.status !== 'success') throw new Error(result.message || `Gagal menjalankan aksi: ${action}`);
  return result; // Kembalikan seluruh objek result
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  
  const filterParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (dateRange?.from && dateRange?.to) {
      params.startDate = format(dateRange.from, 'yyyy-MM-dd');
      params.endDate = format(dateRange.to, 'yyyy-MM-dd');
    }
    if (selectedNames.length > 0) {
      params.names = selectedNames.join(',');
    }
    return params;
  }, [dateRange, selectedNames]);

  const { data: shipments, isLoading, isError } = useQuery<Shipment[]>({ 
    queryKey: ['shipments', filterParams],
    queryFn: () => fetchApi('getShipments', filterParams).then(res => (res as { data: Shipment[] }).data)
  });
  
  const { data: drivers } = useQuery<DriverData[]>({ 
    queryKey: ['drivers'], 
    queryFn: () => fetchApi('getDrivers').then(res => (res as { data: DriverData[] }).data), 
    enabled: !!session 
  });

  const mutationOptions = {
    onSuccess: (data: ApiResponse) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
    onError: (error: Error) => toast.error("Terjadi error: " + error.message),
  };

  const addShipmentMutation = useMutation({ mutationFn: (data: Record<string, unknown>) => fetchApi('addShipment', { data: JSON.stringify(data) }) as Promise<ApiResponse>, ...mutationOptions, onSettled: () => setIsInputModalOpen(false) });
  const updateShipmentMutation = useMutation({ mutationFn: (data: Record<string, unknown>) => fetchApi('updateShipment', { data: JSON.stringify(data) }) as Promise<ApiResponse>, ...mutationOptions, onSettled: () => setEditingShipment(null) });
  const deleteShipmentMutation = useMutation({ mutationFn: (rowIndex: number) => fetchApi('deleteShipment', { rowIndex }) as Promise<ApiResponse>, ...mutationOptions, onSettled: () => setDeletingShipment(null) });

  function handleAddSubmit(values: z.infer<typeof shipmentSchema>) {
    const driverData = drivers?.find(d => d.nama === values.NAMA);
    addShipmentMutation.mutate({
        submitId: uuidv4(), submitDate: new Date().toISOString().split('T')[0],
        nik: driverData?.nik || '', nama: values.NAMA, tanggal: format(values.TANGGAL, "yyyy-MM-dd"),
        shipment: values.SHIPMENT, jumlahToko: values.JUMLAH_TOKO, terkirim: values.TERKIRIM,
        gagal: values.JUMLAH_TOKO - values.TERKIRIM, alasan: values.ALASAN || '',
    });
  }

  function handleUpdateSubmit(values: z.infer<typeof shipmentSchema>, originalShipment: Shipment) {
    updateShipmentMutation.mutate({
        ...originalShipment,
        TANGGAL: format(values.TANGGAL, "yyyy-MM-dd"),
        SHIPMENT: values.SHIPMENT, 'JUMLAH TOKO': values.JUMLAH_TOKO,
        TERKIRIM: values.TERKIRIM, GAGAL: values.JUMLAH_TOKO - values.TERKIRIM,
        ALASAN: values.ALASAN || '',
    });
  }

  function handleConfirmDelete() {
    if (deletingShipment) {
      deleteShipmentMutation.mutate(deletingShipment.rowIndex);
    }
  }

  const columns = useMemo<ColumnDef<Shipment>[]>(() => [
    { accessorKey: "NAMA", header: "Nama Driver" },
    { accessorKey: "TANGGAL", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Tanggal<ArrowUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => format(new Date(row.getValue("TANGGAL")), "dd MMM yyyy", { locale: id }) },
    { accessorKey: "SHIPMENT", header: "Shipment" },
    { accessorKey: "JUMLAH TOKO", header: "Jml. Toko" },
    { accessorKey: "TERKIRIM", header: "Terkirim" },
    { accessorKey: "GAGAL", header: "Gagal" },
    { accessorKey: "ALASAN", header: "Alasan" },
    { id: "actions", cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setEditingShipment(row.original)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeletingShipment(row.original)} className="text-red-500">Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ], []);

  const processedData = useMemo(() => {
    const dataToProcess = shipments || [];
    const userName = session?.user?.name;
    
    const filteredShipments = session?.user?.status === 'admin' 
      ? dataToProcess 
      : (userName ? dataToProcess.filter(s => s.NAMA === userName) : []);
    
    const totalHk = new Set(filteredShipments.map(s => s.TANGGAL)).size;
    const totalDp = filteredShipments.reduce((acc, s) => acc + Number(s['JUMLAH TOKO'] || 0), 0);
    const totalTerkirim = filteredShipments.reduce((acc, s) => acc + Number(s.TERKIRIM || 0), 0);
    const totalGagal = filteredShipments.reduce((acc, s) => acc + Number(s.GAGAL || 0), 0);
    const pieChartData = [{ name: 'Terkirim', value: totalTerkirim }, { name: 'Gagal', value: totalGagal }];
    const dailyData: { [key: string]: { terkirim: number; gagal: number } } = {};
    filteredShipments.forEach(s => {
      const tanggal = format(new Date(s.TANGGAL), "dd MMM", { locale: id });
      if (!dailyData[tanggal]) dailyData[tanggal] = { terkirim: 0, gagal: 0 };
      dailyData[tanggal].terkirim += Number(s.TERKIRIM || 0);
      dailyData[tanggal].gagal += Number(s.GAGAL || 0);
    });
    const stackedChartData = Object.entries(dailyData).map(([tanggal, data]) => ({ tanggal, ...data }));
    let ranking: RankingData[] = [];
    if (session?.user?.status === 'admin') {
      const driverStats: { [key: string]: { totalToko: number; totalTerkirim: number; } } = {};
      (shipments || []).forEach(s => {
        if (!driverStats[s.NAMA]) driverStats[s.NAMA] = { totalToko: 0, totalTerkirim: 0 };
        driverStats[s.NAMA].totalToko += Number(s['JUMLAH TOKO'] || 0);
        driverStats[s.NAMA].totalTerkirim += Number(s.TERKIRIM || 0);
      });
      ranking = Object.entries(driverStats).map(([nama, data]) => {
        const percTerkirim = data.totalToko > 0 ? (data.totalTerkirim / data.totalToko) * 100 : 0;
        const percGagal = 100 - percTerkirim;
        return { nama, percTerkirim: percTerkirim.toFixed(1) + '%', percGagal: percGagal.toFixed(1) + '%', score: percTerkirim };
      }).sort((a, b) => b.score - a.score).slice(0, 3);
    }
    return { totalHk, totalDp, totalTerkirim, totalGagal, ranking, stackedChartData, pieChartData, filteredShipments };
  }, [shipments, session]);

  const tableColumns = useMemo(() => {
    // Perbaikan: Tambahkan pengecekan 'accessorKey' in col
    if (session?.user?.status === 'personal') return columns.filter(col => 'accessorKey' in col && col.accessorKey !== 'NAMA');
    return columns;
  }, [session?.user?.status, columns]);

  if (sessionStatus === "loading") return <div className="flex justify-center items-center h-screen">Memeriksa sesi...</div>;
  
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Selamat datang, {session?.user?.name || "Pengguna"}</h1>
          <p className="text-muted-foreground">STRESS | Shipment Tracking Report & Engagemenet Support System</p>
        </div>
        <Button onClick={() => setIsInputModalOpen(true)}>Input Shipment Baru</Button>
      </header>
      
      <Card>
        <CardHeader><CardTitle>Filter Data</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          {session?.user?.status === 'admin' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start">
                  {selectedNames.length > 0 ? `Terpilih ${selectedNames.length} driver` : "Pilih Driver"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Cari driver..." />
                  <CommandList>
                    <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                    <CommandGroup>
                      {(drivers || []).map((driver) => (
                        <CommandItem
                          key={driver.nik}
                          onSelect={() => {
                            const newSelection = selectedNames.includes(driver.nama)
                              ? selectedNames.filter(name => name !== driver.nama)
                              : [...selectedNames, driver.nama];
                            setSelectedNames(newSelection);
                          }}
                        >
                          <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", selectedNames.includes(driver.nama) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span>{driver.nama}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          {(dateRange || selectedNames.length > 0) && (
            <Button variant="ghost" onClick={() => { setDateRange(undefined); setSelectedNames([]); }}>
              <FilterX className="mr-2 h-4 w-4" /> Reset Filter
            </Button>
          )}
        </CardContent>
      </Card>
      
      {isLoading ? <div className="text-center py-10">Memuat data...</div> : isError ? <div className="text-center py-10 text-red-500">Gagal memuat data.</div> : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total HK" value={processedData.totalHk} icon={CalendarDays} />
            <StatCard title="Total DP" value={processedData.totalDp} icon={Package} />
            <StatCard title="Total Terkirim" value={processedData.totalTerkirim} icon={CheckCircle} />
            <StatCard title="Total Gagal" value={processedData.totalGagal} icon={XCircle} />
          </div>
          
          {session?.user?.status === 'admin' && processedData.ranking.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Ranking Performa</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {processedData.ranking.map((driver, index) => (
                  <Card key={driver.nama}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">{driver.nama}</CardTitle>
                      <Trophy className={`w-6 h-6 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-yellow-700'}`} />
                    </CardHeader>
                    <CardContent>
                      <p>% Terkirim: <span className="font-bold text-green-600">{driver.percTerkirim}</span></p>
                      <p>% Gagal: <span className="font-bold text-red-600">{driver.percGagal}</span></p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>Performa Harian</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedData.stackedChartData}>
                    <XAxis dataKey="tanggal" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="terkirim" name="Terkirim" stackId="a" fill="#16a34a" />
                    <Bar dataKey="gagal" name="Gagal" stackId="a" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Persentase Keseluruhan</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={processedData.pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {processedData.pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={['#16a34a', '#dc2626'][index % 2]} />))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Rekap Shipment</h2>
            <DataTable columns={tableColumns} data={processedData.filteredShipments} />
          </div>
        </>
      )}
      
      <InputShipmentForm isOpen={isInputModalOpen} setIsOpen={setIsInputModalOpen} session={session} drivers={drivers || []} onSubmit={handleAddSubmit} isSubmitting={addShipmentMutation.isPending}/>
      <EditShipmentForm isOpen={!!editingShipment} setIsOpen={() => setEditingShipment(null)} shipment={editingShipment} onSubmit={handleUpdateSubmit} isSubmitting={updateShipmentMutation.isPending} />
      <AlertDialog open={!!deletingShipment} onOpenChange={() => setDeletingShipment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>Aksi ini tidak dapat dibatalkan. Ini akan menghapus data shipment secara permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteShipmentMutation.isPending}>
              {deleteShipmentMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
