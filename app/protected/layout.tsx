// app/(dashboard)/layout.tsx - Client Component
'use client';

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div className="p-8">Loading dashboard...</div>;
  }
  
  // Safe to render client-side components after mount
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col w-full">
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
              </div>
              <div className="ml-auto flex items-center gap-2">
                {/* Add header elements like profile menu, notifications here */}
              </div>
            </header>
            <div className="flex-1 overflow-auto p-4 w-full h-full">
              {children}
            </div>
            <footer className="border-t py-3 px-4 text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
            </footer>
          </SidebarInset>
        </main>
      </div>
    </SidebarProvider>
  );
}