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
    if (!confirm('¿Eliminar este caso?')) return;
    await window.lumen.examples.delete(exId);
    loadExamples(pId);
  };

  return (
    <div>
      <div className="dark-card p-5 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <FileText size={20} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-lumen-text">Casos de Ejemplo</h2>
          <p className="text-xs text-lumen-text-muted">Casos resueltos organizados por política</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-lumen-accent/20 border-t-lumen-accent rounded-full animate-spin" /></div>
      ) : policies.length === 0 ? (
        <div className="dark-card flex flex-col items-center justify-center py-16">
          <FileText size={40} strokeWidth={1} className="text-lumen-text-muted mb-3" />
          <p className="text-sm text-lumen-text-secondary">No hay políticas aún</p>
          <p className="text-xs text-lumen-text-muted mt-1">Agrega políticas primero para crear casos de ejemplo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => {
            const isOpen = expanded === p.id;
            const items = examples[p.id] || [];
            return (
              <div key={p.id} className="dark-card overflow-hidden">
                <button onClick={() => toggle(p.id)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-lumen-card-hover transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={16} className="text-amber-400" /> : <ChevronRight size={16} className="text-lumen-text-muted" />}
                    <span className="text-sm font-medium text-lumen-text">{p.name}</span>
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full font-medium">{p.department}</span>
                  </div>
                  {isOpen && <span className="text-xs text-lumen-text-muted">{items.length} ejemplo{items.length !== 1 ? 's' : ''}</span>}
                </button>

                {isOpen && (
                  <div className="border-t border-lumen-border px-5 py-4">
                    <div className="flex justify-end mb-3">
                      <button onClick={() => { setFormPolicyId(p.id); setForm({ problem_description: '', response_used: '', result: '' }); setShowForm(true); }}
                        className="btn-ghost !text-amber-400 !border-amber-500/20 hover:!bg-amber-500/10">
                        <Plus size={12} /> Agregar ejemplo
                      </button>
                    </div>

                    {items.length === 0 ? (
                      <p className="text-xs text-lumen-text-muted text-center py-4">No hay casos de ejemplo para esta política</p>
                    ) : (
                      <div className="space-y-2.5">
                        {items.map((ex) => (
                          <div key={ex.id} className="bg-lumen-surface border border-lumen-border rounded-xl p-3.5 group">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 space-y-2">
                                <div><span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Problema:</span><p className="text-xs text-lumen-text-secondary mt-0.5">{ex.problem_description}</p></div>
                                <div><span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Respuesta:</span><p className="text-xs text-lumen-text-secondary mt-0.5">{ex.response_used}</p></div>
                                <div><span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Resultado:</span><p className="text-xs text-lumen-text-secondary mt-0.5">{ex.result}</p></div>
                              </div>
                              <button onClick={() => handleDelete(ex.id, p.id)}
                                className="p-1 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                <Trash2 size={12} className="text-red-400/70" />
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
              <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Descripción del problema *</label>
              <textarea value={form.problem_description} onChange={(e) => setForm((f) => ({ ...f, problem_description: e.target.value }))} rows={3} className="dark-input resize-y" placeholder="¿Cuál era el problema?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Respuesta usada *</label>
              <textarea value={form.response_used} onChange={(e) => setForm((f) => ({ ...f, response_used: e.target.value }))} rows={3} className="dark-input resize-y" placeholder="¿Qué respuesta se dio?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Resultado *</label>
              <textarea value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} rows={2} className="dark-input resize-y" placeholder="¿Se resolvió? ¿Se escaló?" />
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
