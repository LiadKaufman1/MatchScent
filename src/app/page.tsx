"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, type Perfume, type Dupe } from '@/lib/supabase';
import { mockPerfumes, mockDupes } from '@/lib/mockData';
import LivePriceButtons from './components/LivePriceButtons';

export default function Home() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [dupes, setDupes] = useState<Dupe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerfume, setSelectedPerfume] = useState<Perfume | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Try to fetch from Supabase if environment variables exist
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const { data: pData } = await supabase.from('perfumes').select('*');
          const { data: dData } = await supabase.from('dupes').select('*');
          if (pData && pData.length > 0) {
            setPerfumes(pData);
            setDupes(dData || []);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching from Supabase:', error);
        }
      }
      
      // Fallback to mock data if no Supabase data or config
      setPerfumes(mockPerfumes);
      setDupes(mockDupes);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredPerfumes = perfumes.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPerfumeDupes = (perfumeId: string) => {
    return dupes.filter(d => d.original_perfume_id === perfumeId).sort((a, b) => b.similarity_score - a.similarity_score);
  };

  return (
    <main className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-transparent -z-10" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 border border-slate-900/10 mb-8">
            <Sparkles className="w-4 h-4 text-slate-700" />
            <span className="text-sm font-medium text-slate-700">Find your perfect scent</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
            Match<span className="text-slate-400">Scent</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Explore fragrances inspired by the world&apos;s most iconic perfumes.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for a perfume or brand..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-lg"
            />
          </div>
        </motion.div>
      </section>

      {/* Perfumes Grid */}
      <section className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredPerfumes.map((perfume, index) => (
              <motion.div 
                key={perfume.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group cursor-pointer hover-lift bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col"
                onClick={() => setSelectedPerfume(perfume)}
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  <Image 
                    src={perfume.image_url} 
                    alt={perfume.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/90 backdrop-blur text-xs font-medium px-2 py-1 rounded">
                      View {getPerfumeDupes(perfume.id).length} Similar {getPerfumeDupes(perfume.id).length === 1 ? 'Scent' : 'Scents'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{perfume.brand}</span>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{perfume.name}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                    <span className="text-slate-900 font-semibold">${perfume.price_usd}</span>
                    <span className="text-sm text-slate-400">₪{perfume.price_ils}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Modal / Popup for Dupes */}
      <AnimatePresence>
        {selectedPerfume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedPerfume(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/80 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100">
                    <Image src={selectedPerfume.image_url} alt={selectedPerfume.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>{selectedPerfume.name}</h2>
                    <p className="text-sm text-slate-500">{selectedPerfume.brand} • ${selectedPerfume.price_usd}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPerfume(null)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto p-6 bg-slate-50 flex-1">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Inspired by {selectedPerfume.name}</h3>
                
                {getPerfumeDupes(selectedPerfume.id).length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">We are still curating similar scents for this fragrance.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getPerfumeDupes(selectedPerfume.id).map((dupe) => (
                      <div key={dupe.id} className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors flex flex-col">
                        <div className="flex gap-4 mb-4">
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                            <Image src={dupe.image_url} alt={dupe.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-slate-900">{dupe.name}</h4>
                                <p className="text-xs text-slate-500">{dupe.brand}</p>
                              </div>
                              <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md">
                                {dupe.similarity_score}% Match
                              </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-lg font-bold">${dupe.price_usd}</span>
                              <span className="text-xs text-slate-400">₪{dupe.price_ils}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">{dupe.notes}</p>
                          </div>
                        </div>
                        <LivePriceButtons dupe={dupe} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
