'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Dashboard from '@mui/icons-material/Dashboard';
import People from '@mui/icons-material/People';
import BusinessCenter from '@mui/icons-material/BusinessCenter';
import EventNote from '@mui/icons-material/EventNote';
import BarChart from '@mui/icons-material/BarChart';
import CardMembership from '@mui/icons-material/CardMembership';
import DesignServices from '@mui/icons-material/DesignServices';
import Logout from '@mui/icons-material/Logout';
import Image from 'next/image';
const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, href: '/' },
  { text: 'User', icon: <People />, href: '/user' },
  { text: 'Provider', icon: <BusinessCenter />, href: '/provider' },
  { text: 'Bookings', icon: <EventNote />, href: '/bookings' },
  { text: 'Analytics', icon: <BarChart />, href: '/analytics' },
  { text: 'Subscriptions', icon: <CardMembership />, href: '/subscriptions' },
  { text: 'Services', icon: <DesignServices />, href: '/services' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="w-[300px] bg-[#2f6f1f] text-white flex flex-col min-h-screen">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <Image src="/logo.png" alt="Logo" width={300} height={150} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.text}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive
                ? 'bg-[#82b83b] text-white'
                : 'text-green-100 hover:bg-[#3f842d] hover:text-white'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.text}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 mb-4">
        <button
          onClick={handleLogout}
          className=" cursor-pointer flex items-center gap-4 px-4 py-3 w-full text-green-100 hover:bg-[#3f842d] hover:text-white rounded-xl transition-colors"
        >
          <Logout />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
