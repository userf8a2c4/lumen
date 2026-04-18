import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../Modal';

export default function Examples({ selectedPolicyId }) {
  const [policies, setPolicies] = useState([]);
  const [expanded, setExpanded] = useState(selectedPolicyId || null);
  const [examples, setExamples] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formPolicyId, setFormPolicyId] = useState(null);
  const [form, setForm] = useState({ problem_description: '', response_used: '', result: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.lumen.policies.getAll().then(setPolicies).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (selectedPolicyId) { setExpanded(selectedPolicyId); loadExamples(selectedPolicyId); } }, [selectedPolicyId]);

  const loadExamples = async (id) => {
    const data = await window.lumen.examples.getByPolicy(id);
    setExamples((prev) => ({ ...prev, [id]: data }));
  };

  const toggle = (id) => {
    if (expanded === id) { setExpanded(null); } else { setExpanded(id); if (!examples[id]) loadExamples(id); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.problem_description.trim() || !form.response_used.trim() || !form.result.trim()) return;
    await window.lumen.examples.create({ policy_id: formPolicyId, ...form });
    setShowForm(false);
    loadExamples(formPolicyId);
  };

  const handleDelete = async (exId, pId) => {
    if (!confirm('Eliminar este caso?')) return;
    await window.lumen.examples.delete(exId);
    loadExamples(pId);
  };

  return (
    <div>
      {/* Header */}
      <div className="bento-card mb-4">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(245,158,11,0.08)' }}>
            <FileText size={22} style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <h2>Casos de Ejemplo</h2>
            <p>Casos resueltos organizados por politica</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'var(--lumen-accent)' }} />
        </div>
      ) : policies.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <FileText size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>No hay politicas aun</p>
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => {
            const isOpen = expanded === p.id;
            const items = examples[p.id] || [];
            return (
              <div key={p.id} className="bento-card !p-0 overflow-hidden">
                <button onClick={() => toggle(p.id)} className="w-full flex items-center justify-between px-5 py-3.5 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={15} style={{ color: '#fbbf24' }} /> : <ChevronRight size={15} style={{ color: 'var(--lumen-text-muted)' }} />}
                    <span className="text-[13px] font-medium" style={{ color: 'var(--lumen-text)' }}>{p.name}</span>
                    <span className="px-2.5 py-0.5 text-[10px] rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.08)', color: '#fbbf24' }}>{p.department}</span>
                  </div>
                  {isOpen && <span className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>{items.length} ejemplo{items.length !== 1 ? 's' : ''}</span>}
                </button>

                {isOpen && (
                  <div className="px-5 py-4" style={{ borderTop: '1px solid var(--lumen-border)' }}>
                    <div className="flex justify-end mb-3">
                      <button onClick={() => { setFormPolicyId(p.id); setForm({ problem_description: '', response_used: '', result: '' }); setShowForm(true); }}
                        className="btn-ghost" style={{ color: '#fbbf24', borderColor: 'rgba(245,158,11,0.15)' }}>
                        <Plus size={12} /> Agregar ejemplo
                      </button>
                    </div>

                    {items.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: 'var(--lumen-text-muted)' }}>No hay casos de ejemplo</p>
                    ) : (
                      <div className="space-y-2.5">
                        {items.map((ex) => (
                          <div key={ex.id} className="rounded-2xl p-3.5 group" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1 space-y-2">
                                <div>
                                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#fbbf24' }}>Problema:</span>
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--lumen-text-secondary)' }}>{ex.problem_description}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#fbbf24' }}>Respuesta:</span>
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--lumen-text-secondary)' }}>{ex.response_used}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#fbbf24' }}>Resultado:</span>
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--lumen-text-secondary)' }}>{ex.result}</p>
                                </div>
                              </div>
                              <button onClick={() => handleDelete(ex.id, p.id)}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                <Trash2 size={12} style={{ color: '#f87171' }} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Nuevo caso de ejemplo" onClose={() => setShowForm(false)} wide>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Descripcion del problema *</label>
              <textarea value={form.problem_description} onChange={(e) => setForm((f) => ({ ...f, problem_description: e.target.value }))} rows={3} className="dark-input resize-y" placeholder="Cual era el problema?" />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Respuesta usada *</label>
              <textarea value={form.response_used} onChange={(e) => setForm((f) => ({ ...f, response_used: e.target.value }))} rows={3} className="dark-input resize-y" placeholder="Que respuesta se dio?" />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Resultado *</label>
              <textarea value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} rows={2} className="dark-input resize-y" placeholder="Se resolvio? Se escalo?" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
              <button type="submit" className="btn-accent">Guardar ejemplo</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
