'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import SessionExpiredModal from '@/components/SessionExpiredModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <SessionExpiredModal />
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto h-[calc(100vh-2rem)]">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
