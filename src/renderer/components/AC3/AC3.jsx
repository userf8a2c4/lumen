import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu, Check, Loader2, AlertCircle,
  Save, Trash2, ArrowUpRight, Mail,
  DollarSign, Scale, Wrench, Smile, RefreshCw,
  ClipboardList, History, CalendarDays, Paperclip, X, Image,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = {
  finanzas:   { label: 'FINANZAS',   icon: DollarSign },
  legal:      { label: 'LEGAL',      icon: Scale      },
  tecnico:    { label: 'TÉCNICO',    icon: Wrench     },
  amenidades: { label: 'AMENIDADES', icon: Smile      },
};

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
        fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--lumen-text-muted)', minWidth: 110, paddingTop: 1, flexShrink: 0,
      }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--lumen-text-secondary)', fontFamily: mono ? 'monospace' : 'inherit', lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lumen-text-muted)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--lumen-border)' }} />
    </div>
  );
}

function CategoryBadge({ categoria }) {
  const cat = CATEGORIES[categoria] || CATEGORIES.amenidades;
  const Icon = cat.icon;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid var(--lumen-border-light)', borderRadius: 3 }}>
      <Icon size={12} style={{ color: 'var(--lumen-text)' }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text)' }}>{cat.label}</span>
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
  const cat  = CATEGORIES[c.categoria] || CATEGORIES.amenidades;
  const Icon = cat.icon;
  return (
    <button onClick={onClick} className="w-full text-left" style={{
      padding: '12px 14px', borderBottom: '1px solid var(--lumen-border)',
      background: active ? 'rgba(255,255,255,0.03)' : 'transparent',
      borderLeft: active ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
      transition: 'background 0.12s, border-color 0.12s', cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Icon size={11} style={{ color: 'var(--lumen-text-secondary)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)' }}>{cat.label}</span>
            {c.calendar_event_id && <CalendarDays size={9} style={{ color: 'var(--lumen-text-muted)', marginLeft: 2 }} title="En Calendar" />}
            {c.image_path && <Image size={9} style={{ color: 'var(--lumen-text-muted)' }} title="Con imagen" />}
            <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', marginLeft: 'auto' }}>{STATUS_LABEL[c.status] || c.status}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--lumen-text)', lineHeight: 1.4, marginBottom: 3 }} className="truncate">
            {c.resumen_ejecutivo || c.case_description.slice(0, 60)}
          </p>
          <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>
            {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
          style={{ padding: 4, color: 'var(--lumen-text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <Trash2 size={11} />
        </button>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AC3() {
  const [tab,             setTab]            = useState('triage');
  const [caseInput,       setCaseInput]      = useState('');
  const [decision,        setDecision]       = useState(null);
  const [loading,         setLoading]        = useState(false);
  const [error,           setError]          = useState('');
  const [model,           setModel]          = useState('gemini-2.0-flash');
  const [savedCases,      setSavedCases]     = useState([]);
  const [activeHistCase,  setActiveHistCase] = useState(null);
  const [saving,          setSaving]         = useState(false);
  const [savedId,         setSavedId]        = useState(null);   // id of last saved case
  const [savedOk,         setSavedOk]        = useState(false);
  const [emailDraft,      setEmailDraft]     = useState('');
  const [generatingEmail, setGeneratingEmail]= useState(false);
  const [calBusy,         setCalBusy]        = useState(false);
  const [calOk,           setCalOk]          = useState(false);
  const [calError,        setCalError]       = useState('');
  // Image attachment
  const [attachment,      setAttachment]     = useState(null); // { name, base64, preview }
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  useEffect(() => {
    window.lumen.settings.getModel().then(setModel).catch(() => {});
    loadCases();
  }, []);

  async function loadCases() {
    try { setSavedCases(await window.lumen.ac3.getCases()); } catch {}
  }

  // ── Image pick ────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setAttachment({ name: file.name, base64, preview: ev.target.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ── Triage ────────────────────────────────────────────────────────────────
  async function handleTriage() {
    const desc = caseInput.trim();
    if (!desc) return;
    setLoading(true); setError(''); setDecision(null);
    setEmailDraft(''); setSavedOk(false); setSavedId(null); setCalOk(false); setCalError('');
    try {
      setDecision(await window.lumen.ac3.triage(desc, { model }));
    } catch (err) {
      setError(err.message || 'Error al analizar el caso');
    } finally { setLoading(false); }
  }

  // ── Save case ─────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!decision || saving) return;
    setSaving(true);
    try {
      // Save image first if attached
      let imgPath = null;
      if (attachment) {
        imgPath = await window.lumen.ac3.saveImage(attachment.name, attachment.base64);
      }
      const saved = await window.lumen.ac3.saveCase(caseInput.trim(), { ...decision, image_path: imgPath });
      setSavedId(saved?.id ?? null);
      setSavedOk(true);
      await loadCases();
      setTimeout(() => setSavedOk(false), 2500);
    } catch {}
    setSaving(false);
  }

  // ── Push to Google Calendar ───────────────────────────────────────────────
  async function handlePushCalendar() {
    if (!decision || calBusy) return;
    setCalBusy(true); setCalError('');
    try {
      let imgPath = null;
      // If case already saved with image, use that path; else save image now
      if (attachment) {
        imgPath = await window.lumen.ac3.saveImage(attachment.name, attachment.base64);
      }
      const ev = await window.lumen.ac3.pushToCalendar(decision, caseInput.trim(), imgPath);
      setCalOk(true);
      // If we have a saved case ID, update the calendar event ID
      if (savedId && ev?.id) {
        await window.lumen.ac3.updateCalendarId(savedId, ev.id);
        await loadCases();
      }
      setTimeout(() => setCalOk(false), 3000);
    } catch (err) {
      setCalError(err.message || 'Error al crear evento en Calendar');
    } finally { setCalBusy(false); }
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
    if (activeHistCase?.id === id) setActiveHistCase((p) => ({ ...p, status }));
  }

  // ── Generate email ────────────────────────────────────────────────────────
  async function handleGenerateEmail() {
    if (!decision || generatingEmail) return;
    setGeneratingEmail(true);
    try {
      const ctx = `Categoría: ${decision.categoria}\nResumen: ${decision.resumen_ejecutivo}\nResultado prometido: ${decision.resultado_deseado}\nPasos: ${(decision.pasos_accion || []).join('; ')}\nCaso: ${caseInput}`;
      setEmailDraft(await window.lumen.ai.generateEmail(ctx, { model }));
    } catch {}
    setGeneratingEmail(false);
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleTriage(); }
  }

  const displayDecision = tab === 'history' && activeHistCase ? activeHistCase : decision;
  const isHistoryView   = tab === 'history' && !!activeHistCase;

  // Determine image to show in decision panel
  const displayImage = isHistoryView
    ? (activeHistCase.image_path ? `lumen://${activeHistCase.image_path}` : null)
    : (attachment?.preview || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Cpu size={15} style={{ color: 'var(--lumen-text-secondary)' }} />
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lumen-text)' }}>AC3 — Motor de Decisiones</h2>
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)', letterSpacing: '0.06em' }}>AMAZON-STYLE TRIAGE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid var(--lumen-border)', borderRadius: 3, overflow: 'hidden' }}>
            {[{ id: 'triage', label: 'Triaje', Icon: ClipboardList }, { id: 'history', label: `Historial (${savedCases.length})`, Icon: History }].map(({ id, label, Icon: Ic }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: '5px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.03em',
                background: tab === id ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: tab === id ? 'var(--lumen-text)' : 'var(--lumen-text-muted)',
                border: 'none', cursor: 'pointer',
                borderRight: id === 'triage' ? '1px solid var(--lumen-border)' : 'none',
              }}>
                <Ic size={11} />{label}
              </button>
            ))}
          </div>
          <select value={model} onChange={(e) => setModel(e.target.value)} style={{
            background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3,
            color: 'var(--lumen-text-muted)', fontSize: 11, padding: '5px 8px', cursor: 'pointer', outline: 'none',
          }}>
            <option value="gemini-2.0-flash" style={{ background: '#000' }}>Gemini 2.0 Flash</option>
            <option value="gemini-2.5-pro"   style={{ background: '#000' }}>Gemini 2.5 Pro</option>
          </select>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* LEFT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflowY: 'auto' }}>

          {/* Case input */}
          {tab === 'triage' && (
            <div className="bento-card !p-0" style={{ flexShrink: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--lumen-text-muted)' }}>Descripción del caso</span>
                <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)' }}>Ctrl+Enter para analizar</span>
              </div>
              <textarea
                ref={textareaRef}
                value={caseInput}
                onChange={(e) => setCaseInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe el caso del cliente — tipo de problema, monto, urgencia percibida, historial relevante..."
                rows={5}
                style={{
                  width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--lumen-text)', fontSize: 13, lineHeight: 1.65, resize: 'none',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                }}
              />

              {/* Image attachment preview */}
              {attachment && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={attachment.preview} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--lumen-border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--lumen-text-secondary)', flex: 1 }} className="truncate">{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 4 }}>
                    <X size={12} />
                  </button>
                </div>
              )}

              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Attach image */}
                <button onClick={() => fileInputRef.current?.click()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
                  <Paperclip size={11} /> Imagen
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <div style={{ flex: 1 }} />
                <button onClick={handleTriage} disabled={loading || !caseInput.trim()} className="btn-accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {loading ? <><Loader2 size={12} className="animate-spin" /> Analizando...</> : <><ArrowUpRight size={12} /> Analizar caso</>}
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
          {calError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 3 }}>
              <AlertCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(239,68,68,0.7)' }}>{calError}</span>
            </div>
          )}

          {/* ── Decision panel ── */}
          {displayDecision && (
            <div className="bento-card animate-fade-in-up">

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
                    <><span style={{ width: 1, height: 12, background: 'var(--lumen-border)', display: 'inline-block' }} />
                    <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Local</span></>
                  )}
                </div>
              </div>

              <ConfidenceBar value={displayDecision.confianza} />

              {/* Image — show for both triage (preview) and history (stored) */}
              {displayImage && (
                <>
                  <SectionDivider label="Imagen adjunta" />
                  <div style={{ borderRadius: 3, overflow: 'hidden', border: '1px solid var(--lumen-border)', maxHeight: 280 }}>
                    <img src={displayImage} alt="Imagen del caso" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: 'rgba(0,0,0,0.4)' }} />
                  </div>
                </>
              )}

              <SectionDivider label="Resumen ejecutivo" />
              <p style={{ fontSize: 14, fontWeight: 400, color: 'var(--lumen-text)', lineHeight: 1.5 }}>{displayDecision.resumen_ejecutivo}</p>

              <SectionDivider label="Protocolo de decisión" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DataRow label="DRI"        value={displayDecision.dri} />
                <DataRow label="Plazo"      value={displayDecision.plazo_horas ? `${displayDecision.plazo_horas} horas` : null} mono />
                <DataRow label="Política"   value={displayDecision.politica_aplicable} />
                <DataRow label="Escalar si" value={displayDecision.criterio_escalacion} />
              </div>

              <SectionDivider label="Pasos de acción" />
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(displayDecision.pasos_accion || []).map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: 'var(--lumen-text-muted)', minWidth: 18, paddingTop: 2 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--lumen-text-secondary)', lineHeight: 1.5 }}>{step}</span>
                  </li>
                ))}
              </ol>

              <SectionDivider label="Resultado esperado" />
              <p style={{ fontSize: 12, color: 'var(--lumen-text-secondary)', lineHeight: 1.55 }}>{displayDecision.resultado_deseado}</p>

              {displayDecision.contacto_sugerido && (
                <><SectionDivider label="Contacto asignado" />
                <p style={{ fontSize: 12, color: 'var(--lumen-text)', fontWeight: 500 }}>{displayDecision.contacto_sugerido}</>)}

              {displayDecision.notas_internas && (
                <><SectionDivider label="Notas internas" />
                <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.55, fontStyle: 'italic' }}>{displayDecision.notas_internas}</>)}

              {/* Status (history mode) */}
              {isHistoryView && (
                <><SectionDivider label="Estado del caso" />
                <div style={{ display: 'flex', gap: 6 }}>
                  {Object.entries(STATUS_LABEL).map(([key, lbl]) => (
                    <button key={key} onClick={() => handleStatusChange(activeHistCase.id, key)} style={{
                      padding: '5px 12px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
                      border: '1px solid var(--lumen-border)',
                      background: activeHistCase.status === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: activeHistCase.status === key ? 'var(--lumen-text)' : 'var(--lumen-text-muted)',
                    }}>{lbl}</button>
                  ))}
                </div></>
              )}

              {/* Action buttons (triage mode only) */}
              {!isHistoryView && (
                <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--lumen-border)', flexWrap: 'wrap' }}>
                  <button onClick={handleSave} disabled={saving || savedOk} className="btn-accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {savedOk ? <><Check size={12} /> Guardado</> : saving ? <><Loader2 size={12} className="animate-spin" /> Guardando...</> : <><Save size={12} /> Guardar caso</>}
                  </button>
                  <button onClick={handlePushCalendar} disabled={calBusy || calOk} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {calOk ? <><Check size={12} /> En Calendar</> : calBusy ? <><Loader2 size={12} className="animate-spin" /> Enviando...</> : <><CalendarDays size={12} /> Guardar en Calendar</>}
                  </button>
                  <button onClick={handleGenerateEmail} disabled={generatingEmail} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {generatingEmail ? <><Loader2 size={12} className="animate-spin" /> Generando...</> : <><Mail size={12} /> Borrador email</>}
                  </button>
                  <button onClick={() => { setDecision(null); setCaseInput(''); setEmailDraft(''); setSavedOk(false); setSavedId(null); setCalOk(false); setCalError(''); setAttachment(null); }}
                    className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <RefreshCw size={11} /> Nuevo caso
                  </button>
                </div>
              )}

              {/* Email draft */}
              {emailDraft && (
                <div style={{ marginTop: 14 }}>
                  <SectionDivider label="Borrador de email" />
                  <textarea value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} rows={8} style={{
                    width: '100%', padding: '12px 14px', background: 'transparent',
                    border: '1px solid var(--lumen-border)', borderRadius: 3, outline: 'none',
                    color: 'var(--lumen-text-secondary)', fontSize: 12, lineHeight: 1.65,
                    fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box',
                  }} />
                </div>
              )}
            </div>
          )}

          {/* Empty states */}
          {tab === 'triage' && !decision && !loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', opacity: 0.4 }}>
              <Cpu size={28} style={{ color: 'var(--lumen-text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                Describe el caso y presiona Analizar.<br />AC3 lo clasificará con protocolo Amazon-style.
              </p>
            </div>
          )}
          {tab === 'history' && !activeHistCase && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', opacity: 0.4 }}>
              <History size={28} style={{ color: 'var(--lumen-text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>Selecciona un caso del historial.</p>
            </div>
          )}
        </div>

        {/* RIGHT — case history */}
        <div style={{ width: 280, flexShrink: 0, border: '1px solid var(--lumen-border)', borderRadius: 4, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--lumen-text-muted)' }}>Historial</span>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>{savedCases.length}</span>
          </div>
          {savedCases.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}>
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', padding: '0 16px', lineHeight: 1.6 }}>Los casos guardados aparecerán aquí</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {savedCases.map((c) => (
                <CaseCard key={c.id} c={c} active={activeHistCase?.id === c.id}
                  onClick={() => { setActiveHistCase(c); setTab('history'); }}
                  onDelete={handleDelete} />
              ))}
            </div>
          )}
          {savedCases.length > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--lumen-border)', display: 'flex', gap: 12 }}>
              {Object.entries(savedCases.reduce((acc, c) => { acc[c.categoria] = (acc[c.categoria] || 0) + 1; return acc; }, {})).map(([cat, n]) => {
                const cfg = CATEGORIES[cat] || CATEGORIES.amenidades;
                const Ic  = cfg.icon;
                return <div key={cat} title={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Ic size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>{n}</span>
                </div>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
