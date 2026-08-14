import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Briefcase, Building2, Search, X } from 'lucide-react';
import { displayBorough } from '../../data/adapters';
import { loadBuildingIndex, managementKey } from '../../data/client';
import type { StabiliIndexRecord } from '../../data/schema';
import type { Route } from '../../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose, onSelectBuilding, onSelectManagement }) => {
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<StabiliIndexRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose();
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') { event.preventDefault(); if (isOpen) onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || records.length) return;
    setLoading(true); setError(false);
    loadBuildingIndex().then(setRecords).catch(() => setError(true)).finally(() => setLoading(false));
  }, [isOpen, records.length]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return { buildings: [] as StabiliIndexRecord[], management: [] as string[] };
    const buildings = records.filter((record) => [record.address, record.zipCode, displayBorough(record.borough), record.managementName].some((value) => value?.toLocaleLowerCase().includes(normalized))).slice(0, 6);
    const management = Array.from(new Set(records.map((record) => record.managementName).filter((value): value is string => Boolean(value) && value!.toLocaleLowerCase().includes(normalized)))).slice(0, 4);
    return { buildings, management };
  }, [query, records]);

  if (!isOpen) return null;
  const hasResults = results.buildings.length > 0 || results.management.length > 0;

  return <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/25 backdrop-blur-xs" onClick={onClose}>
    <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3"><Search className="w-4 h-4 text-teal-600" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search address, borough, ZIP, or management..." className="flex-1 text-sm bg-transparent focus:outline-none" />{query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}<button onClick={onClose} className="text-[11px] px-2 py-0.5 bg-slate-100 rounded-md border">ESC</button></div>
      <div className="max-h-96 overflow-y-auto p-2">
        {loading ? <p className="p-6 text-center text-xs text-slate-500">Loading generated search index…</p> : error ? <p className="p-6 text-center text-xs text-rose-700">The generated search index could not be loaded.</p> : !query.trim() ? <p className="p-6 text-center text-xs text-slate-500">Start typing to search the current generated dataset.</p> : !hasResults ? <p className="p-6 text-center text-xs text-slate-500">No matching records found.</p> : <>
          {results.buildings.map((record) => <button key={record.id} onClick={() => { onSelectBuilding(record.id); onClose(); }} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left group"><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center"><Building2 className="w-4 h-4" /></span><span><strong className="block text-sm text-slate-900">{record.address ?? 'Address unavailable'}</strong><small className="text-xs text-slate-500">{displayBorough(record.borough)}{record.zipCode ? ` · ${record.zipCode}` : ''}</small></span></div><ArrowRight className="w-3.5 h-3.5 text-slate-400" /></button>)}
          {results.management.map((name) => <button key={name} onClick={() => { onSelectManagement(managementKey(name)); onClose(); }} className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left"><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><Briefcase className="w-4 h-4" /></span><span><strong className="block text-sm text-slate-900">{name}</strong><small className="text-xs text-slate-500">Exact management name on generated records</small></span></div><ArrowRight className="w-3.5 h-3.5 text-slate-400" /></button>)}
        </>}
      </div>
    </div>
  </div>;
};
