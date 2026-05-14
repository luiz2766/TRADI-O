'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, PaymentMethod, Sale } from '@/lib/types';
import { registerSale, deleteSale } from '@/lib/sales';
import { 
  Ticket, 
  Minus, 
  Plus, 
  Banknote, 
  Smartphone, 
  CreditCard,
  ChevronRight,
  History,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PortariaPage() {
  const [tickets, setTickets] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0 });
  
  // Selection State
  const [selectedTicket, setSelectedTicket] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [ticketsRes, salesRes] = await Promise.all([
      supabase.from('products').select('*').eq('category', 'ingresso').order('name'),
      supabase
        .from('sales')
        .select('*, sale_items(*, products(*))')
        .eq('type', 'portaria')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    if (!ticketsRes.error) setTickets(ticketsRes.data || []);
    if (!salesRes.error) {
      setRecentSales(salesRes.data || []);
      
      const total = salesRes.data?.reduce((acc, s) => acc + s.total, 0) || 0;
      setStats({ total, count: salesRes.data?.length || 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Realtime subscription
    const channel = supabase
      .channel('portaria-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: "type=eq.portaria" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleConfirmSale = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);

    try {
      await registerSale({
        total: selectedTicket.price * quantity,
        payment_method: paymentMethod,
        type: 'portaria',
        items: [{
          product_id: selectedTicket.id,
          quantity,
          unit_price: selectedTicket.price
        }]
      });

      toast.success('Venda realizada com sucesso!');
      setSelectedTicket(null);
      setQuantity(1);
    } catch (error: any) {
      toast.error('Erro ao registrar venda: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSale = async (id: string) => {
    if (!confirm('Deseja cancelar esta venda?')) return;
    try {
      await deleteSale(id);
      toast.success('Venda cancelada');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao cancelar: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-card border border-brand-border p-4 rounded-2xl flex flex-col justify-center shadow-lg">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Hoje</p>
          <p className="text-2xl font-display font-bold text-amber-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total)}
          </p>
        </div>
        <div className="bg-brand-card border border-brand-border p-4 rounded-2xl flex flex-col justify-center shadow-lg">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ingressos</p>
          <p className="text-2xl font-display font-bold text-white">{stats.count}</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-amber-500" />
          Tipos de Ingresso
        </h2>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-brand-card border border-brand-border p-8 rounded-2xl text-center text-gray-500 italic">
            Nenhum ingresso cadastrado em Produtos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tickets.map(ticket => (
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-brand-card border border-brand-border p-5 rounded-2xl flex items-center justify-between hover:border-amber-500/30 transition-all group shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all">
                    <Ticket className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white text-lg">{ticket.name}</p>
                    <p className="text-gray-500 text-sm">Unitário: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket.price)}</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-amber-500 transition-all" />
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          Últimas Vendas
        </h2>
        <div className="space-y-2">
          {recentSales.map(sale => (
            <div key={sale.id} className="bg-brand-sidebar border border-brand-border p-4 rounded-xl flex items-center justify-between group shadow-sm">
              <div>
                <p className="font-medium text-sm">
                  {sale.sale_items?.[0]?.products?.name || 'Venda'} x {sale.sale_items?.[0]?.quantity}
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">
                  {format(new Date(sale.created_at), "HH:mm '•' dd/MM", { locale: ptBR })} • {sale.payment_method}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-amber-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total)}
                </p>
                <button 
                  onClick={() => handleCancelSale(sale.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {recentSales.length === 0 && (
            <p className="text-center text-gray-600 py-4 text-sm italic">Nenhuma venda hoje.</p>
          )}
        </div>
      </section>

      {/* Sale Modal/Drawer */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-brand-card border-t md:border border-brand-border rounded-t-3xl md:rounded-3xl p-8 shadow-2xl pb-safe"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-display font-bold">Lançar Ingresso</h2>
                  <p className="text-amber-500 font-medium">{selectedTicket.name}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Quantity */}
                <div className="flex items-center justify-between bg-brand-bg/50 border border-brand-border p-4 rounded-2xl">
                  <span className="font-bold text-gray-400">Quantidade</span>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center hover:bg-white/5 transition-all"
                    >
                      <Minus className="w-5 h-5 text-gray-300" />
                    </button>
                    <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center hover:bg-white/5 transition-all text-amber-500"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Forma de Pagamento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                      { id: 'pix', label: 'Pix', icon: Smartphone },
                      { id: 'debito', label: 'Débito', icon: CreditCard },
                      { id: 'credito', label: 'Crédito', icon: CreditCard },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border transition-all text-sm font-bold",
                          paymentMethod === method.id 
                            ? "bg-amber-500/20 border-amber-500 text-amber-500" 
                            : "bg-brand-bg/50 border-brand-border text-gray-500 hover:border-white/20"
                        )}
                      >
                        <method.icon className={cn("w-5 h-5", paymentMethod === method.id ? "text-amber-500" : "text-gray-600")} />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-400">Total a Pagar</span>
                    <span className="text-3xl font-display font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTicket.price * quantity)}
                    </span>
                  </div>

                  <button
                    disabled={isProcessing}
                    onClick={handleConfirmSale}
                    className="w-full amber-gradient text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <ChevronRight className="w-6 h-6" />
                        CONFIRMAR VENDA
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
