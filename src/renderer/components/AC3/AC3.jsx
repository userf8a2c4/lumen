import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu, ChevronRight, Check, Loader2, AlertCircle,
  Save, Trash2, Clock, ArrowUpRight, Mail,
  DollarSign, Scale, Wrench, Smile, RefreshCw,
  ClipboardList, History,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = {
  finanzas:   { label: 'FINANZAS',   icon: DollarSign },
  legal:      { label: 'LEGAL',      icon: Scale      },
  tecnico:    { label: 'TÉCNICO',    icon: Wrench     },
  amenidades: { label: 'AMENIDADES', icon: Smile      },
};

const URGENCIA_RANK = { critica: 4, alta: 3, media: 2, baja: 1 };

const TIPO_LABEL = {
  'T1-irreversible': 'TIPO 1 — Irreversible',
  'T2-reversible':   'TIPO 2 — Reversible',
};

const URGENCIA_LABEL = {
  critica: 'CRÍTICA',
  alta:    'ALTA',
  media:   'MEDIA',
  baja:    'BAJA',
};

const STATUS_LABEL = {
  open:     'Abierto',
  resolved: 'Resuelto',
  escalated:'Escalado',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function DataRow({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 16, paddingBottom: 10, borderBottom: '1px solid var(--lumen-border)' }}>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--lumen-text-muted)',
        minWidth: 110, paddingTop: 1, flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontSize: 12, color: 'var(--lumen-text-secondary)',
        fontFamily: mono ? 'monospace' : 'inherit', lineHeight: 1.5,
      }}>{value}</span>
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lumen-text-muted)' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--lumen-border)' }} />
    </div>
  );
}

function CategoryBadge({ categoria }) {
  const cat = CATEGORIES[categoria] || CATEGORIES.amenidades;
  const Icon = cat.icon;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', border: '1px solid var(--lumen-border-light)',
      borderRadius: 3,
    }}>
      <Icon size={12} style={{ color: 'var(--lumen-text)' }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text)' }}>
        {cat.label}
      </span>
    </div>
  );
}

function ConfidenceBar({ value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 2, background: 'var(--lumen-border)', borderRadius: 1 }}>
        <div style={{ width: `${value}%`, height: '100%', background: 'rgba(255,255,255,0.65)', borderRadius: 1, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--lumen-text-muted)', minWidth: 32 }}>{value}%</span>
    </div>
  );
}

function CaseCard({ c, active, onClick, onDelete }) {
  const cat = CATEGORIES[c.categoria] || CATEGORIES.amenidades;
  const Icon = cat.icon;
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--lumen-border)',
        background: active ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderLeft: active ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
        transition: 'background 0.12s, border-color 0.12s',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Icon size={11} style={{ color: 'var(--lumen-text-secondary)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)' }}>
              {cat.label}
            </span>
            <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', marginLeft: 'auto' }}>
              {STATUS_LABEL[c.status] || c.status}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--lumen-text)', lineHeight: 1.4, marginBottom: 3 }} className="truncate">
            {c.resumen_ejecutivo || c.case_description.slice(0, 60)}
          </p>
          <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>
            {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
          style={{ padding: 4, color: 'var(--lumen-text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AC3({ userName = 'Lu' }) {
  const [tab,             setTab]            = useState('triage');   // 'triage' | 'history'
  const [caseInput,       setCaseInput]      = useState('');
  const [decision,        setDecision]       = useState(null);
  const [loading,         setLoading]        = useState(false);
  const [error,           setError]          = useState('');
  const [model,           setModel]          = useState('gemini-1.5-flash');
  const [savedCases,      setSavedCases]     = useState([]);
  const [activeHistCase,  setActiveHistCase] = useState(null);
  const [saving,          setSaving]         = useState(false);
  const [saved,           setSaved]          = useState(false);
  const [emailDraft,      setEmailDraft]     = useState('');
  const [generatingEmail, setGeneratingEmail]= useState(false);
  const textareaRef = useRef(null);

  // Load model preference and saved cases
  useEffect(() => {
    window.lumen.settings.getModel().then(setModel).catch(() => {});
    loadCases();
  }, []);

  async function loadCases() {
    try {
      const cases = await window.lumen.ac3.getCases();
      setSavedCases(cases);
    } catch {}
  }

  // ── Triage ────────────────────────────────────────────────────────────────
  async function handleTriage() {
    const desc = caseInput.trim();
    if (!desc) return;
    setLoading(true);
    setError('');
    setDecision(null);
    setEmailDraft('');
    setSaved(false);
    try {
      const result = await window.lumen.ac3.triage(desc, { model });
      setDecision(result);
    } catch (err) {
      setError(err.message || 'Error al analizar el caso');
    } finally {
      setLoading(false);
    }
  }

  // ── Save case to history ──────────────────────────────────────────────────
  async function handleSave() {
    if (!decision || saving) return;
    setSaving(true);
    try {
      await window.lumen.ac3.saveCase(caseInput.trim(), decision);
      setSaved(true);
      await loadCases();
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  // ── Delete from history ───────────────────────────────────────────────────
  async function handleDelete(id) {
    await window.lumen.ac3.deleteCase(id);
    if (activeHistCase?.id === id) setActiveHistCase(null);
    await loadCases();
  }

  // ── Update status ─────────────────────────────────────────────────────────
  async function handleStatusChange(id, status) {
    await window.lumen.ac3.updateStatus(id, status);
    await loadCases();
    if (activeHistCase?.id === id) {
      setActiveHistCase((prev) => ({ ...prev, status }));
    }
  }

  // ── Generate email draft ──────────────────────────────────────────────────
  async function handleGenerateEmail() {
    if (!decision || generatingEmail) return;
    setGeneratingEmail(true);
    try {
      const context = `Categoría: ${decision.categoria}
Resumen: ${decision.resumen_ejecutivo}
Resultado prometido: ${decision.resultado_deseado}
Pasos a seguir: ${(decision.pasos_accion || []).join('; ')}
Caso original: ${caseInput}`;
      const email = await window.lumen.ai.generateEmail(context, { model });
      setEmailDraft(email);
    } catch {}
    setGeneratingEmail(false);
  }

  // ── Keyboard shortcut Ctrl+Enter ─────────────────────────────────────────
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTriage();
    }
  }

  const displayDecision = tab === 'history' && activeHistCase ? activeHistCase : decision;
  const isHistoryView   = tab === 'history' && activeHistCase;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={15} style={{ color: 'var(--lumen-text-secondary)' }} />
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lumen-text)' }}>
            AC3 — Motor de Decisiones
          </h2>
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)', letterSpacing: '0.06em' }}>
            AMAZON-STYLE TRIAGE
          </span>
        </div>

        {/* Tab + model toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', border: '1px solid var(--lumen-border)', borderRadius: 3, overflow: 'hidden' }}>
            {[{ id: 'triage', label: 'Triaje', Icon: ClipboardList }, { id: 'history', label: `Historial (${savedCases.length})`, Icon: History }].map(({ id, label, Icon: Ic }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: '5px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.03em',
                background: tab === id ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: tab === id ? 'var(--lumen-text)' : 'var(--lumen-text-muted)',
                border: 'none', cursor: 'pointer',
                borderRight: id === 'triage' ? '1px solid var(--lumen-border)' : 'none',
              }}>
                <Ic size={11} />
                {label}
              </button>
            ))}
          </div>

          {/* Model */}
          <select value={model} onChange={(e) => setModel(e.target.value)} style={{
            background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3,
            color: 'var(--lumen-text-muted)', fontSize: 11, padding: '5px 8px', cursor: 'pointer',
            outline: 'none',
          }}>
            <option value="gemini-1.5-flash" style={{ background: '#000' }}>Gemini Flash</option>
            <option value="gemini-1.5-pro"   style={{ background: '#000' }}>Gemini Pro</option>
          </select>
        </div>
      </div>

      {/* ── Body: two columns ── */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* ── LEFT: input + decision ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflowY: 'auto' }}>

          {/* Case input (only in triage tab) */}
          {tab === 'triage' && (
            <div className="bento-card !p-0" style={{ flexShrink: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--lumen-text-muted)' }}>
                  Descripción del caso
                </span>
                <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)' }}>Ctrl+Enter para analizar</span>
              </div>
              <textarea
                ref={textareaRef}
                value={caseInput}
                onChange={(e) => setCaseInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe el caso del cliente con el mayor detalle posible — tipo de problema, monto involucrado, historial relevante, urgencia percibida..."
                rows={5}
                style={{
                  width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--lumen-text)', fontSize: 13, lineHeight: 1.65, resize: 'none',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                }}
              />
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--lumen-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleTriage}
                  disabled={loading || !caseInput.trim()}
                  className="btn-accent"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {loading
                    ? <><Loader2 size={12} className="animate-spin" /> Analizando...</>
                    : <><ArrowUpRight size={12} /> Analizar caso</>}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3 }}>
              <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)' }}>{error}</span>
            </div>
          )}

          {/* ── Decision Output ── */}
          {displayDecision && (
            <div className="bento-card animate-fade-in-up">

              {/* Header row: category + meta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <CategoryBadge categoria={displayDecision.categoria} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--lumen-text-secondary)' }}>
                    {URGENCIA_LABEL[displayDecision.urgencia] || displayDecision.urgencia}
                  </span>
                  <span style={{ width: 1, height: 12, background: 'var(--lumen-border)', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', letterSpacing: '0.04em' }}>
                    {TIPO_LABEL[displayDecision.tipo_decision] || displayDecision.tipo_decision}
                  </span>
                  {displayDecision._isLocal && (
                    <>
                      <span style={{ width: 1, height: 12, background: 'var(--lumen-border)', display: 'inline-block' }} />
                      <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Local</span>
                    </>
                  )}
                </div>
              </div>

              {/* Confidence */}
              <ConfidenceBar value={displayDecision.confianza} />

              {/* Executive summary */}
              <SectionDivider label="Resumen ejecutivo" />
              <p style={{ fontSize: 14, fontWeight: 400, color: 'var(--lumen-text)', lineHeight: 1.5, marginBottom: 0 }}>
                {displayDecision.resumen_ejecutivo}
              </p>

              {/* Protocol data */}
              <SectionDivider label="Protocolo de decisión" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DataRow label="DRI"          value={displayDecision.dri} />
                <DataRow label="Plazo"        value={displayDecision.plazo_horas ? `${displayDecision.plazo_horas} horas` : null} mono />
                <DataRow label="Política"     value={displayDecision.politica_aplicable} />
                <DataRow label="Escalar si"   value={displayDecision.criterio_escalacion} />
              </div>

              {/* Steps */}
              <SectionDivider label="Pasos de acción" />
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(displayDecision.pasos_accion || []).map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                      color: 'var(--lumen-text-muted)', minWidth: 18, paddingTop: 2,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--lumen-text-secondary)', lineHeight: 1.5 }}>{step}</span>
                  </li>
                ))}
              </ol>

              {/* Result + contact */}
              <SectionDivider label="Resultado esperado" />
              <p style={{ fontSize: 12, color: 'var(--lumen-text-secondary)', lineHeight: 1.55 }}>
                {displayDecision.resultado_deseado}
              </p>

              {displayDecision.contacto_sugerido && (
                <>
                  <SectionDivider label="Contacto asignado" />
                  <p style={{ fontSize: 12, color: 'var(--lumen-text)', fontWeight: 500 }}>
                    {displayDecision.contacto_sugerido}
                  </p>
                </>
              )}

              {displayDecision.notas_internas && (
                <>
                  <SectionDivider label="Notas internas" />
                  <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.55, fontStyle: 'italic' }}>
                    {displayDecision.notas_internas}
                  </p>
                </>
              )}

              {/* ── Status (history mode) ── */}
              {isHistoryView && (
                <>
                  <SectionDivider label="Estado del caso" />
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Object.entries(STATUS_LABEL).map(([key, lbl]) => (
                      <button key={key} onClick={() => handleStatusChange(activeHistCase.id, key)}
                        style={{
                          padding: '5px 12px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
                          border: '1px solid var(--lumen-border)',
                          background: activeHistCase.status === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                          color: activeHistCase.status === key ? 'var(--lumen-text)' : 'var(--lumen-text-muted)',
                        }}>{lbl}</button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Action buttons (triage mode) ── */}
              {!isHistoryView && (
                <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--lumen-border)', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="btn-accent"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {saved
                      ? <><Check size={12} /> Guardado</>
                      : saving
                      ? <><Loader2 size={12} className="animate-spin" /> Guardando...</>
                      : <><Save size={12} /> Guardar caso</>}
                  </button>
                  <button
                    onClick={handleGenerateEmail}
                    disabled={generatingEmail}
                    className="btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {generatingEmail
                      ? <><Loader2 size={12} className="animate-spin" /> Generando...</>
                      : <><Mail size={12} /> Borrador email</>}
                  </button>
                  <button
                    onClick={() => { setDecision(null); setCaseInput(''); setEmailDraft(''); setSaved(false); }}
                    className="btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}
                  >
                    <RefreshCw size={11} /> Nuevo caso
                  </button>
                </div>
              )}

              {/* ── Email draft ── */}
              {emailDraft && (
                <div style={{ marginTop: 14 }}>
                  <SectionDivider label="Borrador de email" />
                  <textarea
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    rows={8}
                    style={{
                      width: '100%', padding: '12px 14px', background: 'transparent',
                      border: '1px solid var(--lumen-border)', borderRadius: 3, outline: 'none',
                      color: 'var(--lumen-text-secondary)', fontSize: 12, lineHeight: 1.65,
                      fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Empty state — triage */}
          {tab === 'triage' && !decision && !loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', opacity: 0.4 }}>
              <Cpu size={28} style={{ color: 'var(--lumen-text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Describe el caso y presiona Analizar.<br />
                AC3 lo clasificará y generará un protocolo Amazon-style.
              </p>
            </div>
          )}

          {/* Empty state — history */}
          {tab === 'history' && !activeHistCase && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', opacity: 0.4 }}>
              <History size={28} style={{ color: 'var(--lumen-text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Selecciona un caso del historial.
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: case history ── */}
        <div style={{
          width: 280, flexShrink: 0, border: '1px solid var(--lumen-border)', borderRadius: 4,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--lumen-text-muted)' }}>
              Historial
            </span>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>
              {savedCases.length}
            </span>
          </div>

          {savedCases.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}>
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', padding: '0 16px', lineHeight: 1.6 }}>
                Los casos guardados aparecerán aquí
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {savedCases.map((c) => (
                <CaseCard
                  key={c.id}
                  c={c}
                  active={activeHistCase?.id === c.id}
                  onClick={() => { setActiveHistCase(c); setTab('history'); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Stats footer */}
          {savedCases.length > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--lumen-border)', display: 'flex', gap: 12 }}>
              {Object.entries(
                savedCases.reduce((acc, c) => { acc[c.categoria] = (acc[c.categoria] || 0) + 1; return acc; }, {})
              ).map(([cat, n]) => {
                const cfg = CATEGORIES[cat] || CATEGORIES.amenidades;
                const Ic  = cfg.icon;
                return (
                  <div key={cat} title={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ic size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>{n}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
