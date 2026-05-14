'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Ticket, 
  ShoppingCart, 
  Package, 
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Portaria', icon: Ticket, href: '/portaria' },
    { label: 'Loja', icon: ShoppingCart, href: '/loja' },
    { label: 'Produtos', icon: Package, href: '/produtos' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-bg text-[#e0e0e0]">
      {/* Configuration Warning */}
      {!isSupabaseConfigured() && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white p-2 text-center text-xs font-bold animate-pulse">
           ⚠️ CONFIGURAÇÃO NECESSÁRIA: Adicione as chaves NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no menu Settings &gt; Secrets.
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-brand-sidebar border-r border-brand-border">
        <div className="p-8">
          <div className="flex flex-col gap-1 mb-10">
            <h1 className="text-2xl font-display font-bold tracking-tighter text-amber-500 uppercase leading-none">
              EventMaster<br/>Pro
            </h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  pathname === item.href 
                    ? "bg-brand-border text-amber-500 font-bold shadow-sm" 
                    : "text-gray-400 hover:bg-brand-border/50 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-amber-500" : "text-gray-400 group-hover:text-white")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-brand-border bg-black/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold">
              {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
              <button 
                onClick={signOut}
                className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-brand-sidebar/80 backdrop-blur-md border-b border-brand-border z-50 flex items-center justify-between px-6">
        <span className="text-lg font-display font-bold tracking-tight">EventMaster <span className="text-amber-500">Pro</span></span>
        <button onClick={signOut} className="text-gray-400 hover:text-red-400">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-20 pb-24 md:pt-0 md:pb-0 h-screen overflow-hidden flex flex-col">
        <header className="hidden md:flex h-16 border-b border-brand-border bg-brand-sidebar/50 backdrop-blur-md items-center justify-between px-8">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest">
            {navItems.find(i => i.href === pathname)?.label || 'Painel'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] rounded-full border border-green-500/20 uppercase tracking-widest font-bold">Ao Vivo</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-brand-sidebar/95 backdrop-blur-lg border-t border-brand-border z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-all",
              pathname === item.href ? "text-amber-500" : "text-gray-500"
            )}
          >
            <item.icon className={cn("w-6 h-6", pathname === item.href ? "text-amber-500" : "text-gray-500")} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
