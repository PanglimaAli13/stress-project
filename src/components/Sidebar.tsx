// src/components/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, Truck, LogOut, PanelLeftClose, PanelRightClose } from "lucide-react";
import { Button } from "./ui/button";

// Definisikan tipe untuk props
interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/drivers", icon: Users, label: "Data Driver" },
  { href: "/dashboard/units", icon: Truck, label: "Data Unit" },
];

export function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen p-4 bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        {/* Tampilkan judul hanya jika sidebar terbuka */}
        {isSidebarOpen && <h2 className="text-2xl font-bold">STRESS</h2>}

        {/* Tombol untuk minimize/maximize sidebar */}
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <PanelLeftClose /> : <PanelRightClose />} 
        </Button>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href} title={item.label}>
                <div
                  className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-700 ${
                    pathname === item.href ? "bg-gray-800" : ""
                  } ${!isSidebarOpen && "justify-center"}`}
                >
                  <item.icon className={`w-5 h-5 ${isSidebarOpen && "mr-3"}`} />
                  {/* Tampilkan label hanya jika sidebar terbuka */}
                  {isSidebarOpen && <span>{item.label}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <Button
          variant="destructive"
          className={`w-full flex items-center text-left ${!isSidebarOpen && "justify-center"}`}
          onClick={() => signOut({ callbackUrl: '/' })}
          title="Logout"
        >
          <LogOut className={`w-5 h-5 ${isSidebarOpen && "mr-3"}`} />
          {/* Tampilkan teks logout hanya jika sidebar terbuka */}
          {isSidebarOpen && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}