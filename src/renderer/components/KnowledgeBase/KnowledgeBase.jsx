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

  // Group by department for tree
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
    <div className="flex gap-5">
      {/* Tree sidebar */}
      {showTree && departments.length > 0 && (
        <div className="w-56 shrink-0">
          <div className="dark-card p-3 sticky top-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--lumen-text-muted)' }}>Departamentos</span>
            </div>
            <div className="space-y-0.5">
              {/* All */}
              <button
                onClick={() => setFilterDept('')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: !filterDept ? 'rgba(126,63,242,0.1)' : 'transparent',
                  color: !filterDept ? '#7E3FF2' : 'var(--lumen-text-secondary)',
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
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        background: isActive ? 'rgba(16,185,129,0.1)' : 'transparent',
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
                            className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] truncate transition-colors"
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
        <div className="dark-card p-5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <BookOpen size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--lumen-text)' }}>Base de Conocimiento</h2>
              <p className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>
                {filteredPolicies.length} politica{filteredPolicies.length !== 1 ? 's' : ''}
                {filterDept ? ` en ${filterDept}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {departments.length > 0 && (
              <button onClick={() => setShowTree(!showTree)} className="btn-ghost !py-2 !px-3">
                <FolderOpen size={14} /> {showTree ? 'Ocultar arbol' : 'Arbol'}
              </button>
            )}
            <button
              onClick={() => { setEditingPolicy(null); setShowForm(true); }}
              className="btn-accent"
            >
              <Plus size={16} /> Agregar politica
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(126,63,242,0.2)', borderTopColor: '#7E3FF2' }} />
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
