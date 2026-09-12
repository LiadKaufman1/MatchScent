'use client';

import { useState } from 'react';
import Image from 'next/image';
import { updatePerfume, updateDupe, deleteDupe, logoutAdmin } from '@/lib/actions';
import { Search, LogOut, ChevronDown, ChevronUp, Save, Trash2, Plus } from 'lucide-react';
import type { Perfume, Dupe } from '@/lib/supabase';

export default function AdminDashboard({ perfumes, dupes }: { perfumes: Perfume[], dupes: Dupe[] }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = perfumes.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search perfumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <button 
          onClick={async () => { await logoutAdmin(); window.location.reload(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {filtered.map(perfume => (
          <PerfumeEditor 
            key={perfume.id} 
            perfume={perfume} 
            dupes={dupes.filter(d => d.original_perfume_id === perfume.id)}
            isExpanded={expandedId === perfume.id}
            onToggle={() => setExpandedId(expandedId === perfume.id ? null : perfume.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">No perfumes found matching "{search}"</div>
        )}
      </div>
    </div>
  );
}

function PerfumeEditor({ perfume, dupes, isExpanded, onToggle }: { perfume: Perfume, dupes: Dupe[], isExpanded: boolean, onToggle: () => void }) {
  const [formData, setFormData] = useState({ name: perfume.name, brand: perfume.brand, image_url: perfume.image_url });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePerfume(perfume.id, formData);
      alert('Saved successfully!');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative rounded-lg overflow-hidden border border-slate-200">
            <Image src={perfume.image_url} alt={perfume.name} fill className="object-cover" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{perfume.name}</h3>
            <p className="text-sm text-slate-500">{perfume.brand} • {dupes.length} dupes</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </div>

      {isExpanded && (
        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="mb-8 p-4 bg-white rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Original Perfume Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Brand</label>
                <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Image URL</label>
                <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                <Save className="w-4 h-4" /> Save Original
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Dupes ({dupes.length})</h4>
              <button className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                <Plus className="w-4 h-4" /> Add Dupe
              </button>
            </div>
            
            <div className="space-y-4">
              {dupes.map(dupe => (
                <DupeEditor key={dupe.id} dupe={dupe} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DupeEditor({ dupe }: { dupe: Dupe }) {
  const [formData, setFormData] = useState(dupe);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDupe(dupe.id, formData);
      alert('Saved successfully!');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dupe?')) return;
    setDeleting(true);
    try {
      await deleteDupe(dupe.id);
    } catch (e: any) {
      alert('Error: ' + e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
      <div className="w-16 h-16 relative rounded-lg overflow-hidden border border-slate-100 shrink-0">
        <Image src={formData.image_url} alt={formData.name} fill className="object-cover" />
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Brand</label>
          <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">Image URL</label>
          <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Price (USD)</label>
          <input type="number" value={formData.price_usd} onChange={e => setFormData({...formData, price_usd: Number(e.target.value)})} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Similarity (%)</label>
          <input type="number" value={formData.similarity_score} onChange={e => setFormData({...formData, similarity_score: Number(e.target.value)})} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">Link (Local / IL)</label>
          <input type="text" value={formData.purchase_link_il || ''} onChange={e => setFormData({...formData, purchase_link_il: e.target.value})} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-500 mb-1">Link (Amazon)</label>
          <input type="text" value={formData.purchase_link_amazon || ''} onChange={e => setFormData({...formData, purchase_link_amazon: e.target.value})} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" />
        </div>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button onClick={handleSave} disabled={saving} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50" title="Save">
          <Save className="w-4 h-4" />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
