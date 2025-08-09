// src/app/dashboard/drivers/page.tsx

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Mail, Home, Car, Edit, Trash2, Save, ArrowLeft, Calendar as CalendarIcon, Upload, KeyRound, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tipe data baru untuk driver
interface Driver {
    rowIndex: number;
    'NIK': string;
    'NAMA LENGKAP': string;
    'TEMPAT LAHIR': string;
    'TANGGAL LAHIR': string;
    'ALAMAT': string;
    'JENIS SIM': 'A' | 'B1' | 'B1 UMUM' | 'B2' | 'B2 UMUM' | 'C';
    'SIM': string;
    'MASA BERLAKU': string;
    'NO. TELP': string;
    'EMAIL': string;
    'UNIT': string;
    'FOTO PROFILE': string;
    'USERNAME'?: string;
    'PASSWORD'?: string;
}

// Tipe data untuk respons API yang diharapkan
type ApiResponse = {
    message: string;
    newUrl?: string;
    [key: string]: unknown;
};

// Fungsi API yang sudah diperbaiki
const fetchApi = async (action: string, method: 'GET' | 'POST' = 'GET', params?: Record<string, unknown>): Promise<unknown> => {
  if (method === 'GET') {
    let url = `${process.env.NEXT_PUBLIC_APPS_SCRIPT_URL}?action=${action}`;
    if (params) {
        for (const key in params) {
            url += `&${key}=${encodeURIComponent(String(params[key]))}`;
        }
    }
    const res = await fetch(url);
    const result = await res.json();
    if (result.status !== 'success') throw new Error(result.message || `Gagal menjalankan aksi: ${action}`);
    // Perbaikan: Kembalikan seluruh objek result agar bisa akses .message
    return result;
  } else { // POST
    const res = await fetch(process.env.NEXT_PUBLIC_APPS_SCRIPT_URL!, {
      method: 'POST',
      body: JSON.stringify({ action, payload: params }),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    if (result.status !== 'success') throw new Error(result.message || `Gagal menjalankan aksi: ${action}`);
    return result;
  }
};

// Komponen Profil Detail yang sudah dirombak
function DriverProfile({ driver, isEditable, onBack, session }: { driver: Driver, isEditable: boolean, onBack?: () => void, session: Session | null }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState(driver);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setFormData(driver); }, [driver]);

    const mutationOptions = {
        onSuccess: (data: ApiResponse) => { 
            toast.success(data.message); 
            queryClient.invalidateQueries({ queryKey: ['allDrivers'] }); 
        },
        onError: (error: Error) => toast.error("Terjadi error: " + error.message),
    };

    // Perbaikan: Tambahkan type assertion `as Promise<ApiResponse>`
    const updateMutation = useMutation({ mutationFn: (data: Driver) => fetchApi('updateDriver', 'GET', { data: JSON.stringify(data) }) as Promise<ApiResponse>, ...mutationOptions, onSettled: () => setIsEditing(false) });
    const deleteMutation = useMutation({ mutationFn: (rowIndex: number) => fetchApi('deleteDriver', 'GET', { rowIndex }) as Promise<ApiResponse>, ...mutationOptions, onSettled: () => { setIsDeleting(false); onBack?.(); } });
    const uploadPhotoMutation = useMutation({ mutationFn: (data: { fileData: string; oldFileUrl: string; driverName: string }) => fetchApi('uploadProfilePicture', 'POST', data) as Promise<ApiResponse>, ...mutationOptions });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSelectChange = (name: string, value: string) => setFormData(prev => ({ ...prev, [name]: value }));
    const handleDateChange = (name: string, date: Date | undefined) => setFormData(prev => ({ ...prev, [name]: date ? format(date, "yyyy-MM-dd") : '' }));

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                uploadPhotoMutation.mutate({ fileData: base64String, oldFileUrl: formData['FOTO PROFILE'], driverName: formData['NAMA LENGKAP'] }, {
                    onSuccess: (data) => {
                        const responseData = data as { newUrl: string };
                        const updatedFormData = { ...formData, 'FOTO PROFILE': responseData.newUrl };
                        setFormData(updatedFormData);
                        updateMutation.mutate(updatedFormData);
                    }
                });
            }
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => updateMutation.mutate(formData);
    
    const simOptions = ['A', 'B1', 'B1 UMUM', 'B2', 'B2 UMUM', 'C'];

    return (
        <div className="space-y-4">
            {onBack && <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Button>}
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="p-6 bg-slate-50 rounded-t-lg">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="relative group" onClick={() => isEditing && fileInputRef.current?.click()}>
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg cursor-pointer">
                                <AvatarImage src={formData['FOTO PROFILE']} alt={formData['NAMA LENGKAP']} onError={(e) => e.currentTarget.src = `https://placehold.co/128x128/E2E8F0/475569?text=${formData['NAMA LENGKAP'].charAt(0)}`} />
                                <AvatarFallback>{formData['NAMA LENGKAP'].charAt(0)}</AvatarFallback>
                            </Avatar>
                            {isEditing && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full transition-opacity opacity-0 group-hover:opacity-100"><Upload className="text-white h-8 w-8" /></div>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        
                        <div className="flex-1">
                            {isEditing ? <Input name="NAMA LENGKAP" value={formData['NAMA LENGKAP']} onChange={handleInputChange} className="text-3xl font-bold h-12 mb-2" /> : <CardTitle className="text-3xl">{formData['NAMA LENGKAP']}</CardTitle>}
                            <CardDescription>NIK: {isEditing && session?.user?.status === 'admin' ? <Input name="NIK" value={formData.NIK} onChange={handleInputChange} /> : formData.NIK}</CardDescription>
                            {isEditable && <div className="mt-4 flex gap-2">{isEditing ? <Button onClick={handleSave} disabled={updateMutation.isPending}><Save className="mr-2 h-4 w-4" /> {updateMutation.isPending ? "Menyimpan..." : "Simpan"}</Button> : <Button onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Profil</Button>}{onBack && <Button variant="destructive" onClick={() => setIsDeleting(true)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</Button>}</div>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">Informasi Pribadi</h3>
                        {isEditing ? (
                            <>
                                <div className="grid w-full items-center gap-1.5"><Label htmlFor="TEMPAT LAHIR">Tempat Lahir</Label><Input id="TEMPAT LAHIR" type="text" name="TEMPAT LAHIR" value={formData['TEMPAT LAHIR']} onChange={handleInputChange} /></div>
                                <div className="grid w-full items-center gap-1.5"><Label>Tanggal Lahir</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData['TANGGAL LAHIR'] ? format(new Date(formData['TANGGAL LAHIR']), "dd MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(formData['TANGGAL LAHIR'])} onSelect={(date) => handleDateChange('TANGGAL LAHIR', date)} initialFocus /></PopoverContent></Popover></div>
                                <div className="grid w-full items-center gap-1.5"><Label htmlFor="ALAMAT">Alamat</Label><Input id="ALAMAT" type="text" name="ALAMAT" value={formData.ALAMAT} onChange={handleInputChange} /></div>
                            </>
                        ) : (
                            <>
                                <p className="flex items-center text-sm"><User className="mr-3 h-4 w-4 text-muted-foreground" /> {formData['TEMPAT LAHIR']}, {formData['TANGGAL LAHIR'] ? format(parseISO(formData['TANGGAL LAHIR']), "dd MMMM yyyy", { locale: id }) : 'N/A'}</p>
                                <p className="flex items-start text-sm"><Home className="mr-3 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" /> {formData.ALAMAT}</p>
                            </>
                        )}
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">Informasi Kontak & Pekerjaan</h3>
                        {isEditing ? (
                            <>
                                <div className="grid w-full items-center gap-1.5"><Label>Jenis SIM</Label><Select name="JENIS SIM" onValueChange={(value) => handleSelectChange('JENIS SIM', value)} value={formData['JENIS SIM']}><SelectTrigger><SelectValue placeholder="Pilih Jenis SIM" /></SelectTrigger><SelectContent>{simOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select></div>
                                <div className="grid w-full items-center gap-1.5"><Label htmlFor="SIM">No. SIM</Label><Input id="SIM" type="text" name="SIM" maxLength={16} value={formData.SIM} onChange={handleInputChange} /></div>
                                <div className="grid w-full items-center gap-1.5"><Label>Masa Berlaku</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{formData['MASA BERLAKU'] ? format(new Date(formData['MASA BERLAKU']), "dd MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(formData['MASA BERLAKU'])} onSelect={(date) => handleDateChange('MASA BERLAKU', date)} initialFocus /></PopoverContent></Popover></div>
                                <div className="grid w-full items-center gap-1.5"><Label htmlFor="NO. TELP">No. Telp</Label><Input id="NO. TELP" type="text" name="NO. TELP" value={formData['NO. TELP']} onChange={handleInputChange} /></div>
                                <div className="grid w-full items-center gap-1.5"><Label htmlFor="EMAIL">Email</Label><Input id="EMAIL" type="email" name="EMAIL" value={formData.EMAIL} onChange={handleInputChange} /></div>
                                <div className="grid w-full items-center gap-1.5"><Label htmlFor="UNIT">Unit</Label><Input id="UNIT" type="text" name="UNIT" value={formData.UNIT} onChange={handleInputChange} /></div>
                            </>
                        ) : (
                            <>
                                <p className="flex items-center text-sm"><Car className="mr-3 h-4 w-4 text-muted-foreground" /> SIM {formData['JENIS SIM']} - {formData.SIM}</p>
                                <p className="flex items-center text-sm"><CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" /> Berlaku s/d {formData['MASA BERLAKU'] ? format(parseISO(formData['MASA BERLAKU']), "dd MMMM yyyy", { locale: id }) : 'N/A'}</p>
                                <p className="flex items-center text-sm"><Phone className="mr-3 h-4 w-4 text-muted-foreground" /> {formData['NO. TELP']}</p>
                                <p className="flex items-center text-sm"><Mail className="mr-3 h-4 w-4 text-muted-foreground" /> {formData.EMAIL}</p>
                                <p className="flex items-center text-sm"><Car className="mr-3 h-4 w-4 text-muted-foreground" /> Unit: {formData.UNIT || <span className="italic text-muted-foreground">STANDBY</span>}</p>
                            </>
                        )}
                    </div>
                    {session?.user?.status === 'admin' && (
                        <div className="md:col-span-2 space-y-4 pt-4 border-t">
                             <h3 className="font-semibold">Informasi Akun</h3>
                             <p className="flex items-center text-sm"><KeyRound className="mr-3 h-4 w-4 text-muted-foreground" /> Username: <span className="font-mono ml-2 p-1 bg-slate-100 rounded">{driver.USERNAME}</span></p>
                             <p className="flex items-center text-sm"><Lock className="mr-3 h-4 w-4 text-muted-foreground" /> Password: <span className="font-mono ml-2 p-1 bg-slate-100 rounded">{driver.PASSWORD}</span></p>
                        </div>
                    )}
                </CardContent>
                <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Aksi ini akan menghapus profil driver secara permanen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(driver.rowIndex)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            </Card>
        </div>
    );
}

// Komponen utama halaman
export default function DriversPage() {
    const { data: session } = useSession();
    const { data: drivers, isLoading, isError } = useQuery<Driver[]>({ queryKey: ['allDrivers'], queryFn: () => fetchApi('getDrivers') as Promise<Driver[]> });
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const myProfile = useMemo(() => {
        // Perbaikan: Lakukan pengecekan yang lebih eksplisit untuk meyakinkan TypeScript
        const userName = session?.user?.name;
        if (!drivers || !userName) {
            return null;
        }
        return drivers.find(driver => driver['NAMA LENGKAP'] === userName);
    }, [drivers, session]);

    if (isLoading) return <div className="text-center py-10">Memuat data driver...</div>;
    if (isError) return <div className="text-center py-10 text-red-500">Gagal memuat data.</div>;

    if (session?.user?.status === 'personal') {
        return (
            <div>
                {myProfile ? <DriverProfile driver={myProfile} isEditable={true} session={session} /> : <p>Profil Anda tidak ditemukan.</p>}
            </div>
        );
    }

    if (selectedDriver) {
        return (
            <DriverProfile driver={selectedDriver} isEditable={true} onBack={() => setSelectedDriver(null)} session={session} />
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Data Driver</h1>
                <p className="text-muted-foreground">Daftar lengkap semua driver. Klik kartu untuk melihat detail.</p>
            </header>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(drivers || []).map((driver) => (
                    <Card key={driver.NIK} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedDriver(driver)}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={driver['FOTO PROFILE']} alt={driver['NAMA LENGKAP']} onError={(e) => e.currentTarget.src = `https://placehold.co/128x128/E2E8F0/475569?text=${driver['NAMA LENGKAP'].charAt(0)}`} />
                                <AvatarFallback>{driver['NAMA LENGKAP'].charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{driver['NAMA LENGKAP']}</CardTitle>
                                <CardDescription>NIK: {driver.NIK}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
