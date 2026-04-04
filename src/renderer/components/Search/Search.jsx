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
      <div className="dark-card p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-lumen-accent/10 flex items-center justify-center">
            <SearchIcon size={20} className="text-lumen-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-lumen-text">Búsqueda Instantánea</h2>
            <p className="text-xs text-lumen-text-muted">Busca en todo el contenido de tus políticas</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lumen-text-muted" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por palabra clave, tema o frase..."
              className="dark-input !pl-10 !pr-8"
              autoFocus />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-lumen-card-hover rounded">
                <X size={14} className="text-lumen-text-muted" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lumen-text-muted pointer-events-none" />
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
          <div className="w-5 h-5 border-2 border-lumen-accent/20 border-t-lumen-accent rounded-full animate-spin" />
        </div>
      )}

      {!searching && hasSearched && results.length === 0 && (
        <div className="dark-card flex flex-col items-center justify-center py-12">
          <SearchIcon size={36} strokeWidth={1} className="text-lumen-text-muted mb-3" />
          <p className="text-sm text-lumen-text-secondary">No se encontraron resultados</p>
          <p className="text-xs text-lumen-text-muted mt-1">Prueba con otros términos o cambia el filtro</p>
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-lumen-text-muted px-1">{results.length} resultado{results.length !== 1 ? 's' : ''}</p>
          {results.map((p) => (
            <div key={p.id} className="dark-card p-4 hover:border-lumen-accent/20 transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-medium text-lumen-text">{p.name}</h3>
                <span className="px-2.5 py-0.5 bg-lumen-accent/10 text-lumen-accent text-xs rounded-full font-medium">{p.department}</span>
              </div>
              {p.description && <p className="text-xs text-lumen-text-secondary mb-2">{p.description}</p>}
              <div className="text-xs text-lumen-text-secondary leading-relaxed bg-lumen-surface rounded-xl p-3 mt-2 border border-lumen-border">
                {p.snippet ? highlight(p.snippet) : highlight((p.content || '').slice(0, 300) + '...')}
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && !hasSearched && (
        <div className="dark-card flex flex-col items-center justify-center py-16">
          <SearchIcon size={40} strokeWidth={1} className="text-lumen-text-muted mb-3" />
          <p className="text-sm text-lumen-text-secondary">Escribe para buscar en tu base de conocimiento</p>
          <p className="text-xs text-lumen-text-muted mt-1">Los resultados aparecen mientras escribes</p>
        </div>
      )}
    </div>
  );
}
