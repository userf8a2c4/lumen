import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Filter, X } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    window.lumen.policies.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() && !department) { setResults([]); setHasSearched(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await window.lumen.policies.search(query.trim(), department || undefined));
        setHasSearched(true);
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, department]);

  const highlight = (text) => {
    if (!text) return null;
    if (text.includes('{{HL}}')) {
      return text.split(/(\{\{HL\}\}.*?\{\{\/HL\}\})/g).map((p, i) =>
        p.startsWith('{{HL}}')
          ? <span key={i} className="search-highlight">{p.replace('{{HL}}', '').replace('{{/HL}}', '')}</span>
          : <span key={i}>{p}</span>
      );
    }
    if (!query.trim()) return text;
    const words = query.trim().split(/\s+/).filter((w) => w.length > 2);
    if (!words.length) return text;
    const regex = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return text.split(regex).map((p, i) => regex.test(p) ? <span key={i} className="search-highlight">{p}</span> : <span key={i}>{p}</span>);
  };

  return (
    <div>
      {/* Search header — Bento */}
      <div className="bento-card mb-4">
        <div className="module-header mb-4">
          <div className="module-icon" style={{ background: 'rgba(126,63,242,0.08)' }}>
            <SearchIcon size={22} style={{ color: '#7E3FF2' }} />
          </div>
          <div>
            <h2>Busqueda Instantanea</h2>
            <p>Busca en todo el contenido de tus politicas</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lumen-text-muted)' }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por palabra clave, tema o frase..."
              className="dark-input !pl-10 !pr-8" autoFocus />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded">
                <X size={13} style={{ color: 'var(--lumen-text-muted)' }} />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--lumen-text-muted)' }} />
            <select value={department} onChange={(e) => setDepartment(e.target.value)}
              className="dark-input !pl-8 !pr-8 !w-auto appearance-none cursor-pointer">
              <option value="">Todos</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {searching && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(126,63,242,0.2)', borderTopColor: '#7E3FF2' }} />
        </div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <div className="bento-card flex flex-col items-center justify-center py-12">
          <SearchIcon size={36} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>No se encontraron resultados</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs px-1" style={{ color: 'var(--lumen-text-muted)' }}>{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          {results.map((p) => (
            <div key={p.id} className="bento-card interactive">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[13px] font-medium" style={{ color: 'var(--lumen-text)' }}>{p.name}</h3>
                <span className="px-2.5 py-0.5 text-[10px] rounded-full font-medium" style={{ background: 'rgba(126,63,242,0.08)', color: '#7E3FF2' }}>{p.department}</span>
              </div>
              {p.description && <p className="text-xs mb-2" style={{ color: 'var(--lumen-text-secondary)' }}>{p.description}</p>}
              <div className="text-xs leading-relaxed rounded-xl p-3 mt-2"
                style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-secondary)' }}>
                {p.snippet ? highlight(p.snippet) : highlight((p.content || '').slice(0, 300) + '...')}
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && !hasSearched && (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <SearchIcon size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>Escribe para buscar en tu base de conocimiento</p>
        </div>
      )}
    </div>
  );
}
