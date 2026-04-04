import React, { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import Modal from '../Modal';
import PolicyForm from './PolicyForm';
import PolicyList from './PolicyList';

export default function KnowledgeBase({ navigateTo }) {
  const [policies, setPolicies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (!confirm('¿Eliminar esta política?')) return;
    await window.lumen.policies.delete(id);
    loadPolicies();
  };

  return (
    <div>
      <div className="dark-card p-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BookOpen size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-lumen-text">Base de Conocimiento</h2>
            <p className="text-xs text-lumen-text-muted">{policies.length} política{policies.length !== 1 ? 's' : ''} registrada{policies.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingPolicy(null); setShowForm(true); }}
          className="btn-accent"
        >
          <Plus size={16} />
          Agregar política
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-lumen-accent/20 border-t-lumen-accent rounded-full animate-spin" />
        </div>
      ) : (
        <PolicyList
          policies={policies}
          onEdit={(p) => { setEditingPolicy(p); setShowForm(true); }}
          onDelete={handleDelete}
          onViewExamples={(p) => navigateTo('examples', { selectedPolicyId: p.id })}
        />
      )}

      {showForm && (
        <Modal title={editingPolicy ? 'Editar política' : 'Nueva política'} onClose={() => { setShowForm(false); setEditingPolicy(null); }} wide>
          <PolicyForm policy={editingPolicy} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingPolicy(null); }} />
        </Modal>
      )}
    </div>
  );
}
