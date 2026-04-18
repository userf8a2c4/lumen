import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, ChevronDown, ChevronRight, FolderOpen, FileText } from 'lucide-react';
import Modal from '../Modal';
import PolicyForm from './PolicyForm';
import PolicyList from './PolicyList';

export default function KnowledgeBase({ navigateTo }) {
  const [policies, setPolicies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [expandedDepts, setExpandedDepts] = useState({});

  const loadPolicies = async () => {
    setLoading(true);
    try { setPolicies(await window.lumen.policies.getAll()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPolicies(); }, []);

  const handleSave = async (data) => {
    editingPolicy
      ? await window.lumen.policies.update(editingPolicy.id, data)
      : await window.lumen.policies.create(data);
    setShowForm(false);
    setEditingPolicy(null);
    loadPolicies();
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta politica?')) return;
    await window.lumen.policies.delete(id);
    loadPolicies();
  };

  const grouped = policies.reduce((acc, p) => {
    (acc[p.department] = acc[p.department] || []).push(p);
    return acc;
  }, {});
  const departments = Object.keys(grouped).sort();

  const toggleDept = (dept) => {
    setExpandedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const filteredPolicies = filterDept
    ? policies.filter((p) => p.department === filterDept)
    : policies;

  return (
    <div className="flex gap-4">
      {/* Tree sidebar */}
      {showTree && departments.length > 0 && (
        <div className="w-56 shrink-0">
          <div className="bento-card !p-3 sticky top-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--lumen-text-muted)' }}>Departamentos</span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setFilterDept('')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: !filterDept ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: !filterDept ? 'var(--lumen-accent)' : 'var(--lumen-text-secondary)',
                }}
              >
                <BookOpen size={13} /> Todas ({policies.length})
              </button>

              {departments.map((dept) => {
                const items = grouped[dept];
                const isExpanded = expandedDepts[dept];
                const isActive = filterDept === dept;

                return (
                  <div key={dept}>
                    <button
                      onClick={() => { setFilterDept(dept); toggleDept(dept); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors"
                      style={{
                        background: isActive ? 'rgba(16,185,129,0.08)' : 'transparent',
                        color: isActive ? '#10b981' : 'var(--lumen-text-secondary)',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <FolderOpen size={13} />
                      <span className="truncate flex-1 text-left">{dept}</span>
                      <span className="text-[10px]" style={{ color: 'var(--lumen-text-muted)' }}>{items.length}</span>
                    </button>

                    {isExpanded && (
                      <div className="ml-5 mt-0.5 space-y-0.5">
                        {items.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setEditingPolicy(p); setShowForm(true); }}
                            className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] truncate transition-colors"
                            style={{ color: 'var(--lumen-text-muted)' }}
                          >
                            <FileText size={10} className="shrink-0" />
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header bento */}
        <div className="bento-card mb-4 flex items-center justify-between">
          <div className="module-header">
            <div className="module-icon" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <BookOpen size={22} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h2>Base de Conocimiento</h2>
              <p>{filteredPolicies.length} politica{filteredPolicies.length !== 1 ? 's' : ''}{filterDept ? ` en ${filterDept}` : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {departments.length > 0 && (
              <button onClick={() => setShowTree(!showTree)} className="btn-ghost !py-2 !px-3">
                <FolderOpen size={14} /> {showTree ? 'Ocultar' : 'Arbol'}
              </button>
            )}
            <button onClick={() => { setEditingPolicy(null); setShowForm(true); }} className="btn-accent">
              <Plus size={15} /> Agregar
            </button>
          </div>
        </div>

        {/* Stats row */}
        {!loading && policies.length > 0 && (
          <div className="bento-grid bento-grid-3 mb-4">
            <div className="bento-card flex items-center gap-3">
              <div className="bento-stat">
                <span className="stat-value">{policies.length}</span>
                <span className="stat-label">Total Politicas</span>
              </div>
            </div>
            <div className="bento-card flex items-center gap-3">
              <div className="bento-stat">
                <span className="stat-value">{departments.length}</span>
                <span className="stat-label">Departamentos</span>
              </div>
            </div>
            <div className="bento-card flex items-center gap-3">
              <div className="bento-stat">
                <span className="stat-value">{policies.filter(p => p.source_url).length}</span>
                <span className="stat-label">Desde URL</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'var(--lumen-accent)' }} />
          </div>
        ) : (
          <PolicyList
            policies={filteredPolicies}
            onEdit={(p) => { setEditingPolicy(p); setShowForm(true); }}
            onDelete={handleDelete}
            onViewExamples={(p) => navigateTo('examples', { selectedPolicyId: p.id })}
          />
        )}

        {showForm && (
          <Modal title={editingPolicy ? 'Editar politica' : 'Nueva politica'} onClose={() => { setShowForm(false); setEditingPolicy(null); }} wide>
            <PolicyForm policy={editingPolicy} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingPolicy(null); }} />
          </Modal>
        )}
      </div>
    </div>
  );
}
