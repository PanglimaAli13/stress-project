// src/app/dashboard/InputShipmentForm.tsx

"use client";

import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shipmentSchema } from "./form-schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Session } from "next-auth";
import { useEffect } from "react";

interface InputShipmentFormProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    session: Session | null;
    drivers: { nik: string; nama: string }[];
    onSubmit: (values: z.infer<typeof shipmentSchema>) => void;
    isSubmitting: boolean;
}

export function InputShipmentForm({ isOpen, setIsOpen, session, drivers, onSubmit, isSubmitting }: InputShipmentFormProps) {
    const form = useForm<z.infer<typeof shipmentSchema>>({
        resolver: zodResolver(shipmentSchema) as Resolver<z.infer<typeof shipmentSchema>>,
        // Perbaikan: Sediakan nilai default yang lengkap sesuai tipe skema
        defaultValues: {
            NAMA: session?.user?.status === 'personal' ? session.user.name ?? "" : "",
            TANGGAL: undefined,
            SHIPMENT: "",
            JUMLAH_TOKO: 0,
            TERKIRIM: 0,
            ALASAN: "",
        },
    });

    useEffect(() => {
        if (isOpen) {
            form.reset({
                NAMA: session?.user?.status === 'personal' ? session.user.name ?? "" : "",
                TANGGAL: undefined,
                SHIPMENT: "",
                JUMLAH_TOKO: 0,
                TERKIRIM: 0,
                ALASAN: "",
            });
        }
    }, [isOpen, session, form]);

    const jumlahToko = form.watch("JUMLAH_TOKO");
    const terkirim = form.watch("TERKIRIM");
    const gagal = !isNaN(Number(jumlahToko)) && !isNaN(Number(terkirim)) ? Number(jumlahToko) - Number(terkirim) : 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Input Shipment Baru</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {session?.user?.status === 'admin' ? (
                            <FormField control={form.control} name="NAMA" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Driver</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih Driver" /></SelectTrigger></FormControl>
                                        <SelectContent>{drivers.map(d => <SelectItem key={d.nik} value={d.nama}>{d.nama}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        ) : (
                            <FormField control={form.control} name="NAMA" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Driver</FormLabel>
                                    <FormControl><Input {...field} readOnly className="font-bold" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )}

                        <FormField control={form.control} name="TANGGAL" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Tanggal</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "dd MMMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        
                        <FormField control={form.control} name="SHIPMENT" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Shipment</FormLabel>
                                <FormControl><Input {...field} type="text" inputMode="numeric" placeholder="10 digit angka" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="JUMLAH_TOKO" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah Toko</FormLabel>
                                    <FormControl><Input {...field} type="number" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="TERKIRIM" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Terkirim</FormLabel>
                                    <FormControl><Input {...field} type="number" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormItem>
                                <FormLabel>Gagal</FormLabel>
                                <FormControl><Input value={gagal} readOnly /></FormControl>
                            </FormItem>
                        </div>

                        {gagal > 0 && (
                            <FormField control={form.control} name="ALASAN" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alasan Gagal</FormLabel>
                                    <FormControl><Input {...field} placeholder="Jelaskan alasan pengiriman gagal" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )}
                        
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
