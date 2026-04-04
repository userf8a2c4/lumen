import React, { useState } from 'react';
import {
  Bot, Send, Copy, Check, Loader2, AlertCircle,
  BookOpen, Users, FileText, Sparkles,
  ChevronDown, ChevronRight, Phone, ExternalLink,
} from 'lucide-react';

function AccordionSection({ title, icon: Icon, count, color, defaultOpen = true, glow = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = {
    green: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400' },
    blue: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400' },
    orange: { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400' },
    violet: { border: 'border-lumen-accent', bg: 'bg-lumen-accent/10', text: 'text-lumen-accent', badge: 'bg-lumen-accent/15 text-lumen-accent' },
  };
  const c = colors[color] || colors.violet;

  return (
    <div className={`dark-card overflow-hidden border-l-[3px] ${open ? c.border : 'border-l-transparent'} transition-all duration-300 ${glow ? 'ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-lumen-card-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon size={16} className={c.text} />
          </div>
          <span className="text-sm font-medium text-lumen-text">{title}</span>
          {count > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${c.badge}`}>{count}</span>
          )}
        </div>
        {open ? <ChevronDown size={16} className="text-lumen-text-muted" /> : <ChevronRight size={16} className="text-lumen-text-muted" />}
      </button>
      {open && <div className="border-t border-lumen-border px-5 py-4">{children}</div>}
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

  const handleAnalyze = async () => {
    if (!caseDesc.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setExpandedPolicy(null);
    try {
      setResult(await window.lumen.ai.analyze(caseDesc.trim()));
    } catch (e) {
      setError(e.message || 'Error al analizar. Verifica tu API Key.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const extractDraft = (text) => {
    const m = text.match(/(?:borrador|respuesta para el cliente|respuesta al cliente)[:\s]*\n([\s\S]*?)(?:\n##|\n\*\*[^*]+\*\*:|\Z)/i);
    return m ? m[1].trim() : text;
  };

  const renderAnalysis = (text) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lumen-accent font-semibold text-sm mt-4 mb-1.5">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lumen-accent font-semibold mt-4 mb-1.5">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-lumen-accent font-bold text-lg mt-4 mb-1.5">{line.slice(2)}</h1>;
      if (line.match(/^\*\*.*\*\*/)) {
        const f = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-lumen-text">$1</strong>');
        return <p key={i} className="text-sm text-[#c4c4d0] mb-1" dangerouslySetInnerHTML={{ __html: f }} />;
      }
      if (line.match(/^[-•]\s/)) {
        const c = line.replace(/^[-•]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-lumen-text">$1</strong>');
        return <li key={i} className="text-sm text-[#c4c4d0] ml-4 mb-1 list-disc" dangerouslySetInnerHTML={{ __html: c }} />;
      }
      if (line.match(/^\d+\.\s/)) {
        const c = line.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-lumen-text">$1</strong>');
        return <li key={i} className="text-sm text-[#c4c4d0] ml-4 mb-1 list-decimal" dangerouslySetInnerHTML={{ __html: c }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      if (line.trim() === '---') return <hr key={i} className="border-lumen-border my-3" />;
      const f = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-lumen-text">$1</strong>');
      return <p key={i} className="text-sm text-[#c4c4d0] mb-1" dangerouslySetInnerHTML={{ __html: f }} />;
    });

  // Detect if escalation is needed
  const needsEscalation = result && result.contactsRelevant && result.contactsRelevant.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="dark-card p-5 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lumen-accent/10 flex items-center justify-center">
          <Bot size={20} className="text-lumen-accent" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-lumen-text">Análisis de Caso</h2>
          <p className="text-xs text-lumen-text-muted">Describe el problema y obtén una solución basada en tus políticas</p>
        </div>
      </div>

      {/* Input card */}
      <div className="dark-card p-5 mb-5">
        <label className="block text-sm font-medium text-lumen-text-secondary mb-2">Describe el caso del cliente</label>
        <textarea
          value={caseDesc}
          onChange={(e) => setCaseDesc(e.target.value)}
          rows={5}
          disabled={loading}
          className="dark-input resize-y leading-relaxed"
          placeholder="Ej: El cliente solicita un reembolso por un cobro duplicado. Dice que ya llamó antes y le dijeron que se resolvería en 48 horas pero ya pasaron 5 días..."
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleAnalyze}
            disabled={loading || !caseDesc.trim()}
            className="btn-accent"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analizando...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generar Mapa de Solución
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="dark-card p-4 mb-5 border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">Error al analizar</p>
            <p className="text-xs text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ═══ STRUCTURED RESPONSE ═══ */}
      {result && (
        <div className="space-y-3 animate-fade-in-up">
          {/* Case summary header */}
          <div className="dark-card p-4 border-l-[3px] border-lumen-cyan">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-lumen-cyan shadow-sm shadow-cyan-400/50" />
              <span className="text-xs font-semibold text-lumen-cyan uppercase tracking-wider">Caso Analizado</span>
              <span className="text-xs text-lumen-text-muted ml-auto">({result.model})</span>
            </div>
            <p className="text-sm text-lumen-text-secondary leading-relaxed line-clamp-2">{caseDesc}</p>
          </div>

          {/* SECTION 1: Related Policies */}
          <AccordionSection
            title="Políticas Relacionadas"
            icon={BookOpen}
            count={result.policiesUsed.length}
            color="green"
            defaultOpen={result.policiesUsed.length > 0}
          >
            {result.policiesUsed.length === 0 ? (
              <p className="text-sm text-lumen-text-muted text-center py-3">No se encontraron políticas directamente relacionadas</p>
            ) : (
              <div className="space-y-2">
                {result.policiesUsed.map((p) => (
                  <div key={p.id} className="bg-lumen-surface rounded-xl p-3.5 border border-lumen-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-lumen-text">{p.name}</h4>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full font-medium">{p.department}</span>
                      </div>
                      <button
                        onClick={() => setExpandedPolicy(expandedPolicy === p.id ? null : p.id)}
                        className="btn-ghost !py-1 !px-2 !text-[11px]"
                      >
                        {expandedPolicy === p.id ? 'Cerrar' : 'Ver completa'}
                        <ExternalLink size={10} />
                      </button>
                    </div>
                    {p.description && <p className="text-xs text-lumen-text-muted">{p.description}</p>}
                    {expandedPolicy === p.id && (
                      <div className="mt-3 pt-3 border-t border-lumen-border">
                        <p className="text-xs text-lumen-text-secondary leading-relaxed whitespace-pre-wrap">
                          Contenido completo disponible en Base de Conocimiento.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          {/* SECTION 2: Escalation Matrix */}
          <AccordionSection
            title="Matriz de Escalación"
            icon={Users}
            count={result.contactsRelevant?.length || 0}
            color="blue"
            defaultOpen={needsEscalation}
            glow={needsEscalation}
          >
            {(!result.contactsRelevant || result.contactsRelevant.length === 0) ? (
              <p className="text-sm text-lumen-text-muted text-center py-3">No se requiere escalación para este caso</p>
            ) : (
              <div className="space-y-2">
                {result.contactsRelevant.map((c) => (
                  <div key={c.id} className="bg-lumen-surface rounded-xl p-3.5 border border-lumen-border flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Users size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-lumen-text">{c.name}</h4>
                      <span className="inline-block px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded-full font-medium mt-0.5">{c.department}</span>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-lumen-text-secondary">
                        <Phone size={10} className="text-lumen-text-muted" />
                        <span>{c.contact_method}</span>
                      </div>
                      <div className="mt-2 bg-lumen-bg rounded-lg p-2.5">
                        <p className="text-[10px] text-lumen-text-muted font-medium mb-0.5">Contactar cuando:</p>
                        <p className="text-xs text-lumen-text-secondary leading-relaxed">{c.when_to_contact}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`Contacto: ${c.name}\nÁrea: ${c.department}\nMedio: ${c.contact_method}`, `contact-${c.id}`)}
                      className="btn-ghost !py-1 !px-2 !text-[11px] shrink-0"
                    >
                      {copied === `contact-${c.id}` ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          {/* SECTION 3: Scripts & Examples */}
          <AccordionSection
            title="Scripts y Ejemplos"
            icon={FileText}
            count={result.examplesRelevant?.length || 0}
            color="orange"
            defaultOpen={result.examplesRelevant?.length > 0}
          >
            {(!result.examplesRelevant || result.examplesRelevant.length === 0) ? (
              <p className="text-sm text-lumen-text-muted text-center py-3">No hay casos de ejemplo previos relacionados</p>
            ) : (
              <div className="space-y-2">
                {result.examplesRelevant.map((ex, i) => (
                  <div key={ex.id || i} className="bg-lumen-surface rounded-xl p-3.5 border border-lumen-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-amber-400">{ex.policy_name}</span>
                      <button
                        onClick={() => copyToClipboard(ex.response_used, `example-${ex.id || i}`)}
                        className="btn-ghost !py-1 !px-2 !text-[11px]"
                      >
                        {copied === `example-${ex.id || i}` ? (
                          <><Check size={10} className="text-emerald-400" /> Copiado</>
                        ) : (
                          <><Copy size={10} /> Copiar script</>
                        )}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] font-semibold text-lumen-text-muted uppercase tracking-wider">Problema:</span>
                        <p className="text-xs text-lumen-text-secondary mt-0.5">{ex.problem_description}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-lumen-text-muted uppercase tracking-wider">Respuesta usada:</span>
                        <p className="text-xs text-lumen-text-secondary mt-0.5 bg-lumen-bg rounded-lg p-2 font-mono">{ex.response_used}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-lumen-text-muted uppercase tracking-wider">Resultado:</span>
                        <p className="text-xs text-lumen-text-secondary mt-0.5">{ex.result}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionSection>

          {/* SECTION 4: Claude Suggestion */}
          <AccordionSection
            title="Sugerencia de Claude"
            icon={Sparkles}
            count={0}
            color="violet"
            defaultOpen={true}
          >
            <div className="bg-lumen-accent/5 rounded-xl p-4 border border-lumen-accent/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-lumen-accent" />
                  <span className="text-xs font-semibold text-lumen-accent uppercase tracking-wider">Procedimiento recomendado basado en tus políticas</span>
                </div>
                <button
                  onClick={() => copyToClipboard(extractDraft(result.analysis), 'draft')}
                  className="btn-ghost !py-1 !px-2.5 !text-[11px]"
                >
                  {copied === 'draft' ? (
                    <><Check size={10} className="text-emerald-400" /> Copiado</>
                  ) : (
                    <><Copy size={10} /> Copiar borrador</>
                  )}
                </button>
              </div>
              <div className="analysis-content">{renderAnalysis(result.analysis)}</div>
            </div>
          </AccordionSection>
        </div>
      )}
    </div>
  );
}
