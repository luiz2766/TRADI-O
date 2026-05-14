'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical,
  X,
  Loader2,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'ingresso', label: 'Ingresso', color: 'bg-indigo-500/20 text-indigo-400' },
  { value: 'bebida', label: 'Bebida', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'comida', label: 'Comida', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-500/20 text-gray-400' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'ingresso' as Category,
    price: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error('Erro ao carregar produtos');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formData.price);
    
    if (isNaN(price)) {
      toast.error('Preço inválido');
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      price: price
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id);
      
      if (error) toast.error('Erro ao editar produto');
      else {
        toast.success('Produto atualizado');
        setIsModalOpen(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([payload]);
      
      if (error) toast.error('Erro ao cadastrar produto');
      else {
        toast.success('Produto cadastrado');
        setIsModalOpen(false);
        fetchProducts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) toast.error('Erro ao excluir produto');
    else {
      toast.success('Produto excluído');
      fetchProducts();
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price.toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'ingresso',
        price: ''
      });
    }
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Produtos</h1>
          <p className="text-gray-400">Gerencie o catálogo do seu evento</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="amber-gradient text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-card border border-brand-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xl"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all border",
              filter === 'all' ? "bg-amber-500 text-white border-amber-500 shadow-md" : "bg-brand-card text-gray-400 border-brand-border"
            )}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all border",
                filter === cat.value ? "bg-amber-500 text-white border-amber-500 shadow-md" : "bg-brand-card text-gray-400 border-brand-border hover:border-white/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-gray-500">Carregando catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
            <Package className="w-16 h-16 text-gray-700" />
            <div>
              <p className="text-lg font-bold text-gray-400">Nenhum produto encontrado</p>
              <p className="text-gray-500">Tente ajustar seus filtros ou cadastrar um novo item.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border bg-white/[0.01]">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preço</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredProducts.map(product => {
                  const category = CATEGORIES.find(c => c.value === product.category);
                  return (
                    <motion.tr 
                      layout
                      key={product.id} 
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold", category?.color)}>
                          {category?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-amber-500 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openModal(product)}
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-brand-card border border-brand-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome do Produto</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Ingresso VIP"
                    className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner appearance-none capitalize"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value} className="bg-brand-sidebar text-white">{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Preço (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0,00"
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full amber-gradient text-white font-bold py-5 rounded-xl mt-4 transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-amber-500/10"
                >
                  {editingProduct ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRODUTO'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Utility to merge classes
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
