'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category, PaymentMethod } from '@/lib/types';
import { registerSale } from '@/lib/sales';
import { 
  ShoppingCart, 
  Search, 
  Minus, 
  Plus, 
  X, 
  Loader2,
  Trash2,
  ChevronRight,
  Banknote,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
}

const STORE_CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bebida', label: 'Bebidas' },
  { value: 'comida', label: 'Comida' },
  { value: 'outro', label: 'Outros' },
];

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('bebida');
  const [search, setSearch] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .neq('category', 'ingresso')
      .order('name');
    
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(current => {
      const existing = current.find(item => item.product.id === product.id);
      if (existing) {
        return current.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado`, { duration: 1000 });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(current => 
      current.map(item => {
        if (item.product.id === productId) {
          const nextQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(current => current.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      await registerSale({
        total: cartTotal,
        payment_method: paymentMethod,
        type: 'loja',
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price
        }))
      });

      toast.success('Venda concluída com sucesso!');
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    } catch (error: any) {
      toast.error('Erro ao finalizar venda: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-display font-bold">Loja</h1>
        
        {/* Horizontal Category Scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {STORE_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border",
                activeCategory === cat.value 
                  ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20" 
                  : "bg-brand-card text-gray-500 border-brand-border"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-card border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xl"
          />
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-brand-card border border-brand-border p-12 rounded-3xl text-center text-gray-500 italic">
          Nenhum produto nesta categoria.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map(product => (
            <motion.div
              layout
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-brand-card border border-brand-border rounded-2xl p-4 flex flex-col gap-3 group active:scale-[0.98] transition-all cursor-pointer hover:border-amber-500/30 shadow-md"
            >
              <div className="w-full aspect-square bg-brand-bg/50 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-gray-800 group-hover:text-amber-500/20 transition-colors" />
              </div>
              <div>
                <p className="font-bold text-white text-sm line-clamp-1">{product.name}</p>
                <p className="text-amber-500 font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) for Cart */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-24 md:bottom-12 right-6 w-16 h-16 amber-gradient rounded-full shadow-2xl flex items-center justify-center z-40 text-white"
        >
          <div className="relative">
            <ShoppingCart className="w-7 h-7" />
            <span className="absolute -top-3 -right-3 bg-white text-amber-600 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border-2 border-amber-600">
              {cartCount}
            </span>
          </div>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-end p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="relative w-full max-w-md h-[90vh] md:h-full bg-brand-sidebar border-l border-brand-border rounded-t-3xl md:rounded-3xl flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Carrinho</h2>
                  <p className="text-sm text-gray-500">{cartCount} itens selecionados</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-4 bg-brand-bg/50 border border-brand-border p-4 rounded-2xl shadow-sm">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-gray-700">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{item.product.name}</p>
                      <p className="text-amber-500 font-bold text-sm">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center text-gray-400 hover:bg-white/5"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-lg min-w-[20px] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center text-amber-500 hover:bg-white/5"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-2 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-brand-sidebar border-t border-brand-border space-y-6 pb-safe">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-display font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                  </span>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full amber-gradient text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-lg hover:shadow-lg hover:shadow-amber-500/10 active:scale-[0.98] transition-all"
                >
                  Continuar para Pagamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Pagamento</h2>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
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
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all shadow-sm",
                        paymentMethod === method.id 
                          ? "bg-amber-500/20 border-amber-500 text-amber-500" 
                          : "bg-brand-bg/50 border-brand-border text-gray-500 hover:border-white/10"
                      )}
                    >
                      <method.icon className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase">{method.label}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-brand-bg/50 border border-brand-border p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        <span>Total do Carrinho</span>
                        <span>{cartCount} itens</span>
                    </div>
                    <div className="flex justify-between text-2xl font-display font-bold text-white">
                        <span>Total Final</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                    </div>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleCheckout}
                  className="w-full amber-gradient text-white font-bold py-5 rounded-2xl text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <ChevronRight className="w-6 h-6" />
                      FINALIZAR VENDA
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
