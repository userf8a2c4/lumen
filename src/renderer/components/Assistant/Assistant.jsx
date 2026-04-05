import React, { useState } from 'react';
import {
  Bot, Send, Copy, Check, Loader2, AlertCircle,
  BookOpen, Users, FileText, Sparkles, StickyNote, Mail,
  ChevronDown, ChevronRight, Phone, ExternalLink,
} from 'lucide-react';

function AccordionSection({ title, icon: Icon, count, color, defaultOpen = true, glow = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = {
    green: { border: '#10b981', bg: 'rgba(16,185,129,0.08)', text: '#10b981', badge: 'rgba(16,185,129,0.12)' },
    blue: { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', text: '#60a5fa', badge: 'rgba(59,130,246,0.12)' },
    orange: { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', text: '#fbbf24', badge: 'rgba(245,158,11,0.12)' },
    violet: { border: '#7E3FF2', bg: 'rgba(126,63,242,0.08)', text: '#7E3FF2', badge: 'rgba(126,63,242,0.12)' },
    pink: { border: '#ec4899', bg: 'rgba(236,72,153,0.08)', text: '#ec4899', badge: 'rgba(236,72,153,0.12)' },
  };
  const c = colors[color] || colors.violet;

  return (
    <div className="bento-card !p-0 overflow-hidden transition-all duration-300"
      style={{
        borderLeft: `3px solid ${open ? c.border : 'transparent'}`,
        boxShadow: glow ? `0 0 20px ${c.bg}` : 'none',
      }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
            <Icon size={15} style={{ color: c.text }} />
          </div>
          <span className="text-[13px] font-medium" style={{ color: 'var(--lumen-text)' }}>{title}</span>
          {count > 0 && (
            <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold" style={{ background: c.badge, color: c.text }}>{count}</span>
          )}
        </div>
        {open ? <ChevronDown size={15} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronRight size={15} style={{ color: 'var(--lumen-text-muted)' }} />}
      </button>
      {open && <div className="px-5 py-4" style={{ borderTop: '1px solid var(--lumen-border)' }}>{children}</div>}
    </div>
  );
}

export default function Assistant() {
  const [caseDesc, setCaseDesc] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [emailContext, setEmailContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);

  const handleAnalyze = async () => {
    if (!caseDesc.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setExpandedPolicy(null);
    setGeneratedEmail('');
    try {
      setResult(await window.lumen.ai.analyze(caseDesc.trim()));
    } catch (e) {
      setError(e.message || 'Error al analizar. Verifica tu API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!emailContext.trim() && !result) return;
    setGeneratingEmail(true);
    try {
      const context = emailContext.trim() || `Caso: ${caseDesc}\n\nAnalisis: ${result?.analysis || ''}`;
      const email = await window.lumen.ai.generateEmail(context);
      setGeneratedEmail(email);
    } catch (e) {
      setError(e.message || 'Error al generar correo.');
    } finally {
      setGeneratingEmail(false);
    }
  };

  const copyToClipboard = async (text, id) => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const extractDraft = (text) => {
    const m = text.match(/(?:borrador|respuesta para el cliente|respuesta al cliente)[:\s]*\n([\s\S]*?)(?:\n##|\n\*\*[^*]+\*\*:|\Z)/i);
    return m ? m[1].trim() : text;
  };

  const renderAnalysis = (text) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="font-semibold text-[13px] mt-4 mb-1.5" style={{ color: '#9B5BFF' }}>{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="font-semibold mt-4 mb-1.5" style={{ color: '#9B5BFF' }}>{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="font-bold text-lg mt-4 mb-1.5" style={{ color: '#9B5BFF' }}>{line.slice(2)}</h1>;
      if (line.match(/^\*\*.*\*\*/)) {
        const f = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--lumen-text)">$1</strong>');
        return <p key={i} className="text-[13px] mb-1" style={{ color: 'var(--lumen-text-secondary)' }} dangerouslySetInnerHTML={{ __html: f }} />;
      }
      if (line.match(/^[-\u2022]\s/)) {
        const c = line.replace(/^[-\u2022]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--lumen-text)">$1</strong>');
        return <li key={i} className="text-[13px] ml-4 mb-1 list-disc" style={{ color: 'var(--lumen-text-secondary)' }} dangerouslySetInnerHTML={{ __html: c }} />;
      }
      if (line.match(/^\d+\.\s/)) {
        const c = line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--lumen-text)">$1</strong>');
        return <li key={i} className="text-[13px] ml-4 mb-1 list-decimal" style={{ color: 'var(--lumen-text-secondary)' }} dangerouslySetInnerHTML={{ __html: c }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      if (line.trim() === '---') return <hr key={i} className="my-3" style={{ borderColor: 'var(--lumen-border)' }} />;
      const f = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--lumen-text)">$1</strong>');
      return <p key={i} className="text-[13px] mb-1" style={{ color: 'var(--lumen-text-secondary)' }} dangerouslySetInnerHTML={{ __html: f }} />;
    });

  const needsEscalation = result && result.contactsRelevant && result.contactsRelevant.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header — Bento card */}
      <div className="bento-card mb-4">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(126,63,242,0.08)' }}>
            <Bot size={22} style={{ color: '#7E3FF2' }} />
          </div>
          <div>
            <h2>Analisis de Caso</h2>
            <p>Describe el problema y obten una solucion basada en tus politicas, notas y contactos</p>
          </div>
        </div>
      </div>

      {/* Input — Bento card */}
      <div className="bento-card mb-4">
        <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--lumen-text-secondary)' }}>Describe el caso del cliente</label>
        <textarea
          value={caseDesc}
          onChange={(e) => setCaseDesc(e.target.value)}
          rows={4}
          disabled={loading}
          className="dark-input resize-y leading-relaxed"
          placeholder="Ej: El cliente solicita un reembolso por un cobro duplicado..."
        />
        <div className="flex justify-end mt-3">
          <button onClick={handleAnalyze} disabled={loading || !caseDesc.trim()} className="btn-accent">
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Analizando...</>
            ) : (
              <><Sparkles size={15} /> Generar Mapa de Solucion</>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bento-card mb-4 flex items-start gap-3" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
          <AlertCircle size={17} style={{ color: '#f87171' }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-medium" style={{ color: '#fca5a5' }}>Error al analizar</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(248,113,113,0.8)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* STRUCTURED RESPONSE — Bento Grid */}
      {result && (
        <div className="space-y-3 animate-float-in">
          {/* Case summary — top bento tile */}
          <div className="bento-card" style={{ borderLeft: '3px solid #00D4FF' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#00D4FF', boxShadow: '0 0 8px rgba(0,212,255,0.5)' }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#00D4FF' }}>Caso Analizado</span>
              <span className="text-[10px] ml-auto font-mono" style={{ color: 'var(--lumen-text-muted)' }}>{result.model}</span>
            </div>
            <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--lumen-text-secondary)' }}>{caseDesc}</p>
          </div>

          {/* Stats row — mini bento tiles */}
          <div className="bento-grid bento-grid-3">
            <div className="bento-card flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <BookOpen size={16} style={{ color: '#10b981' }} />
              </div>
              <div className="bento-stat">
                <span className="stat-value" style={{ fontSize: '22px' }}>{result.policiesUsed.length}</span>
                <span className="stat-label">Politicas</span>
              </div>
            </div>
            <div className="bento-card flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <Users size={16} style={{ color: '#60a5fa' }} />
              </div>
              <div className="bento-stat">
                <span className="stat-value" style={{ fontSize: '22px' }}>{result.contactsRelevant?.length || 0}</span>
                <span className="stat-label">Contactos</span>
              </div>
            </div>
            <div className="bento-card flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <FileText size={16} style={{ color: '#fbbf24' }} />
              </div>
              <div className="bento-stat">
                <span className="stat-value" style={{ fontSize: '22px' }}>{result.examplesRelevant?.length || 0}</span>
                <span className="stat-label">Ejemplos</span>
              </div>
            </div>
          </div>

          {/* Accordion sections */}
          <AccordionSection title="Politicas Relacionadas" icon={BookOpen} count={result.policiesUsed.length} color="green"
            defaultOpen={result.policiesUsed.length > 0}>
            {result.policiesUsed.length === 0 ? (
              <p className="text-[13px] text-center py-3" style={{ color: 'var(--lumen-text-muted)' }}>No se encontraron politicas relacionadas</p>
            ) : (
              <div className="space-y-2">
                {result.policiesUsed.map((p) => (
                  <div key={p.id} className="rounded-2xl p-3.5" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13px] font-medium" style={{ color: 'var(--lumen-text)' }}>{p.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{p.department}</span>
                      </div>
                      <button onClick={() => setExpandedPolicy(expandedPolicy === p.id ? null : p.id)} className="btn-ghost !py-1 !px-2 !text-[11px]">
                        {expandedPolicy === p.id ? 'Cerrar' : 'Ver completa'} <ExternalLink size={10} />
                      </button>
                    </div>
                    {p.description && <p className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>{p.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Matriz de Escalacion" icon={Users} count={result.contactsRelevant?.length || 0} color="blue"
            defaultOpen={needsEscalation} glow={needsEscalation}>
            {(!result.contactsRelevant || result.contactsRelevant.length === 0) ? (
              <p className="text-[13px] text-center py-3" style={{ color: 'var(--lumen-text-muted)' }}>No se requiere escalacion</p>
            ) : (
              <div className="space-y-2">
                {result.contactsRelevant.map((c) => (
                  <div key={c.id} className="rounded-2xl p-3.5 flex items-start gap-3" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.08)' }}>
                      <Users size={15} style={{ color: '#60a5fa' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-medium" style={{ color: 'var(--lumen-text)' }}>{c.name} {c.last_name || ''}</h4>
                      <span className="inline-block px-2 py-0.5 text-[10px] rounded-full font-medium mt-0.5" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>{c.department}</span>
                      {c.contact_method && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Phone size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span>{c.contact_method}</span>
                        </div>
                      )}
                      {c.when_to_contact && (
                        <div className="mt-2 rounded-xl p-2.5" style={{ background: 'var(--lumen-bg)' }}>
                          <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--lumen-text-muted)' }}>Contactar cuando:</p>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--lumen-text-secondary)' }}>{c.when_to_contact}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => copyToClipboard(`Contacto: ${c.name}\nArea: ${c.department}\nMedio: ${c.contact_method}`, `contact-${c.id}`)}
                      className="btn-ghost !py-1 !px-2 !text-[11px] shrink-0">
                      {copied === `contact-${c.id}` ? <Check size={10} style={{ color: '#10b981' }} /> : <Copy size={10} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          <AccordionSection title="Scripts y Ejemplos" icon={FileText} count={result.examplesRelevant?.length || 0} color="orange"
            defaultOpen={result.examplesRelevant?.length > 0}>
            {(!result.examplesRelevant || result.examplesRelevant.length === 0) ? (
              <p className="text-[13px] text-center py-3" style={{ color: 'var(--lumen-text-muted)' }}>No hay casos de ejemplo previos</p>
            ) : (
              <div className="space-y-2">
                {result.examplesRelevant.map((ex, i) => (
                  <div key={ex.id || i} className="rounded-2xl p-3.5" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>{ex.policy_name}</span>
                      <button onClick={() => copyToClipboard(ex.response_used, `example-${ex.id || i}`)} className="btn-ghost !py-1 !px-2 !text-[11px]">
                        {copied === `example-${ex.id || i}` ? <><Check size={10} style={{ color: '#10b981' }} /> Copiado</> : <><Copy size={10} /> Copiar script</>}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--lumen-text-muted)' }}>Problema:</span>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--lumen-text-secondary)' }}>{ex.problem_description}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--lumen-text-muted)' }}>Respuesta usada:</span>
                        <p className="text-xs mt-0.5 rounded-xl p-2 font-mono" style={{ background: 'var(--lumen-bg)', color: 'var(--lumen-text-secondary)' }}>{ex.response_used}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          {result.notesRelevant && result.notesRelevant.length > 0 && (
            <AccordionSection title="Notas Vinculadas" icon={StickyNote} count={result.notesRelevant.length} color="pink" defaultOpen={true}>
              <div className="space-y-1.5">
                {result.notesRelevant.map((n) => (
                  <div key={n.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                    <StickyNote size={13} style={{ color: '#ec4899' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--lumen-text-secondary)' }}>{n.title}</span>
                  </div>
                ))}
              </div>
            </AccordionSection>
          )}

          <AccordionSection title="Sugerencia de Claude" icon={Sparkles} count={0} color="violet" defaultOpen={true}>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(126,63,242,0.04)', border: '1px solid rgba(126,63,242,0.15)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} style={{ color: '#7E3FF2' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#7E3FF2' }}>Procedimiento recomendado</span>
                </div>
                <button onClick={() => copyToClipboard(extractDraft(result.analysis), 'draft')} className="btn-ghost !py-1 !px-2.5 !text-[11px]">
                  {copied === 'draft' ? <><Check size={10} style={{ color: '#10b981' }} /> Copiado</> : <><Copy size={10} /> Copiar borrador</>}
                </button>
              </div>
              <div className="analysis-content">{renderAnalysis(result.analysis)}</div>
            </div>
          </AccordionSection>

          <AccordionSection title="Generador de Correo" icon={Mail} count={0} color="blue" defaultOpen={false}>
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>
                Genera un correo profesional basado en el analisis o escribe contexto adicional.
              </p>
              <textarea
                value={emailContext}
                onChange={(e) => setEmailContext(e.target.value)}
                rows={3}
                className="dark-input resize-y"
                placeholder="Contexto adicional para el correo (opcional, por defecto usa el analisis)..."
              />
              <div className="flex justify-end">
                <button onClick={handleGenerateEmail} disabled={generatingEmail} className="btn-accent !text-[13px]">
                  {generatingEmail ? <><Loader2 size={14} className="animate-spin" /> Generando...</> : <><Mail size={14} /> Generar correo</>}
                </button>
              </div>
              {generatedEmail && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: '#60a5fa' }}>Correo generado</span>
                    <button onClick={() => copyToClipboard(generatedEmail, 'email')} className="btn-ghost !py-1 !px-2 !text-[11px]">
                      {copied === 'email' ? <><Check size={10} style={{ color: '#10b981' }} /> Copiado</> : <><Copy size={10} /> Copiar</>}
                    </button>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--lumen-text-secondary)' }}>{generatedEmail}</pre>
                </div>
              )}
            </div>
          </AccordionSection>
        </div>
      )}
    </div>
  );
}
