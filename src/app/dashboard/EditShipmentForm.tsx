// src/app/dashboard/EditShipmentForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shipmentSchema } from "./form-schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Shipment } from "./columns";
import { useEffect } from "react";

interface EditShipmentFormProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    shipment: Shipment | null;
    onSubmit: (values: z.infer<typeof shipmentSchema>, originalShipment: Shipment) => void;
    isSubmitting: boolean;
}

export function EditShipmentForm({ isOpen, setIsOpen, shipment, onSubmit, isSubmitting }: EditShipmentFormProps) {
    const form = useForm<z.infer<typeof shipmentSchema>>({
        resolver: zodResolver(shipmentSchema),
        defaultValues: {
            NAMA: "",
            SHIPMENT: "",
            ALASAN: "",
        }
    });

    useEffect(() => {
        if (shipment) {
            form.reset({
                NAMA: shipment.NAMA,
                TANGGAL: new Date(shipment.TANGGAL),
                SHIPMENT: String(shipment.SHIPMENT),
                JUMLAH_TOKO: shipment['JUMLAH TOKO'],
                TERKIRIM: shipment.TERKIRIM,
                ALASAN: shipment.ALASAN || "",
            });
        }
    }, [shipment, form]);

    const jumlahToko = form.watch("JUMLAH_TOKO");
    const terkirim = form.watch("TERKIRIM");
    const gagal = !isNaN(Number(jumlahToko)) && !isNaN(Number(terkirim)) ? Number(jumlahToko) - Number(terkirim) : 0;

    const handleFormSubmit = (values: z.infer<typeof shipmentSchema>) => {
        if (shipment) {
            onSubmit(values, shipment);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Edit Shipment</DialogTitle></DialogHeader>
                {shipment && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                            <FormField control={form.control} name="NAMA" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Driver</FormLabel>
                                    <FormControl><Input {...field} readOnly className="font-bold" /></FormControl>
                                </FormItem>
                            )}/>
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
                                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="SHIPMENT" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shipment</FormLabel>
                                    <FormControl><Input {...field} type="number" placeholder="10 digit angka" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={form.control} name="JUMLAH_TOKO" render={({ field }) => (
                                    <FormItem><FormLabel>Jumlah Toko</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="TERKIRIM" render={({ field }) => (
                                    <FormItem><FormLabel>Terkirim</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormItem><FormLabel>Gagal</FormLabel><FormControl><Input value={gagal} readOnly /></FormControl></FormItem>
                            </div>
                            {gagal > 0 && (
                                <FormField control={form.control} name="ALASAN" render={({ field }) => (
                                    <FormItem><FormLabel>Alasan Gagal</FormLabel><FormControl><Input {...field} placeholder="Jelaskan alasan pengiriman gagal" /></FormControl><FormMessage /></FormItem>
                                )}/>
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Memperbarui..." : "Simpan Perubahan"}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
