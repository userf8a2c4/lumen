import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, ZoomIn, ZoomOut, Sun, Contrast, Pencil, Square, Eraser,
  Trash2, Edit3, Check, RotateCcw,
} from 'lucide-react';

const TOOLS = { none: 'none', pen: 'pen', rect: 'rect', eraser: 'eraser' };

export default function EvidenceViewer({ evidence, onClose, onEdit, onDelete }) {
  const [zoom,        setZoom]        = useState(1);
  const [brightness,  setBrightness]  = useState(100);
  const [contrast,    setContrast]    = useState(100);
  const [tool,        setTool]        = useState(TOOLS.none);
  const [penColor,    setPenColor]    = useState('#7E3FF2');
  const [penSize,     setPenSize]     = useState(3);
  const [annotations, setAnnotations] = useState(() => {
    try { return JSON.parse(evidence.annotations || '[]'); } catch { return []; }
  });
  const [savedAnn,    setSavedAnn]    = useState(false);

  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const currentPath = useRef([]);

  const isPDF = evidence.mime_type === 'application/pdf';
  const fileUrl = `lumen://evidences/${evidence.file_path}`;

  // ── Canvas drawing ──────────────────────────────────────────────────────────

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((shape) => {
      ctx.save();
      ctx.strokeStyle = shape.color || '#7E3FF2';
      ctx.lineWidth   = (shape.size || 3) / zoom;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      if (shape.type === 'pen' && shape.points?.length > 1) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0][0], shape.points[0][1]);
        shape.points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.stroke();
      } else if (shape.type === 'rect' && shape.points?.length === 2) {
        const [[x1, y1], [x2, y2]] = shape.points;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }
      ctx.restore();
    });
  }, [annotations, zoom]);

  useEffect(() => { redraw(); }, [redraw]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    return [
      (e.clientX - rect.left) / zoom,
      (e.clientY - rect.top)  / zoom,
    ];
  };

  const onMouseDown = (e) => {
    if (tool === TOOLS.none) return;
    drawing.current = true;
    const pos = getCanvasPos(e);
    if (tool === TOOLS.pen || tool === TOOLS.eraser) {
      currentPath.current = [pos];
    } else if (tool === TOOLS.rect) {
      currentPath.current = [pos, pos];
    }
  };

  const onMouseMove = (e) => {
    if (!drawing.current) return;
    const pos = getCanvasPos(e);
    if (tool === TOOLS.pen) {
      currentPath.current.push(pos);
      // Live preview
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      redraw();
      const pts = currentPath.current;
      if (pts.length > 1) {
        ctx.save();
        ctx.strokeStyle = penColor;
        ctx.lineWidth   = penSize / zoom;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.stroke();
        ctx.restore();
      }
    } else if (tool === TOOLS.rect) {
      currentPath.current[1] = pos;
      redraw();
      const [[x1, y1], [x2, y2]] = currentPath.current;
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext('2d');
      ctx.save();
      ctx.strokeStyle = penColor;
      ctx.lineWidth   = penSize / zoom;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.restore();
    }
  };

  const onMouseUp = () => {
    if (!drawing.current) return;
    drawing.current = false;

    if (tool === TOOLS.eraser) {
      // Remove shapes near current path (simplified: remove last shape)
      setAnnotations((prev) => prev.slice(0, -1));
    } else if (tool === TOOLS.pen && currentPath.current.length > 1) {
      setAnnotations((prev) => [...prev, { type: 'pen', points: [...currentPath.current], color: penColor, size: penSize }]);
    } else if (tool === TOOLS.rect && currentPath.current.length === 2) {
      setAnnotations((prev) => [...prev, { type: 'rect', points: [...currentPath.current], color: penColor, size: penSize }]);
    }
    currentPath.current = [];
  };

  const clearAnnotations = () => {
    if (!confirm('¿Borrar todas las anotaciones?')) return;
    setAnnotations([]);
  };

  const saveAnnotations = async () => {
    await window.lumen.evidence.update(evidence.id, {
      title: evidence.title,
      description: evidence.description,
      tags: JSON.parse(evidence.tags || '[]'),
      case_ref: evidence.case_ref,
      annotations,
    });
    setSavedAnn(true);
    setTimeout(() => setSavedAnn(false), 2000);
  };

  const undoLast = () => setAnnotations((prev) => prev.slice(0, -1));

  // ── Zoom shortcuts ──────────────────────────────────────────────────────────

  const adjustZoom = (delta) => setZoom((z) => Math.max(0.25, Math.min(4, Math.round((z + delta) * 100) / 100)));

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); }
      if (e.ctrlKey && e.key === '=') { e.preventDefault(); adjustZoom(0.25); }
      if (e.ctrlKey && e.key === '-') { e.preventDefault(); adjustZoom(-0.25); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }}>

      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Title */}
        <h2 className="text-[13px] font-medium flex-1 truncate" style={{ color: '#e8e8ed' }}>
          {evidence.title}
        </h2>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => adjustZoom(-0.25)} className="p-1.5 rounded-lg" style={{ color: '#8b8b9e' }}>
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] font-mono w-12 text-center" style={{ color: '#8b8b9e' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => adjustZoom(0.25)} className="p-1.5 rounded-lg" style={{ color: '#8b8b9e' }}>
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Brightness */}
        {!isPDF && (
          <>
            <Sun size={13} style={{ color: '#8b8b9e' }} />
            <input type="range" min={50} max={200} value={brightness}
              onChange={(e) => setBrightness(+e.target.value)}
              className="w-20" title={`Brillo ${brightness}%`} />
            <Contrast size={13} style={{ color: '#8b8b9e' }} />
            <input type="range" min={50} max={200} value={contrast}
              onChange={(e) => setContrast(+e.target.value)}
              className="w-20" title={`Contraste ${contrast}%`} />
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </>
        )}

        {/* Annotation tools (images only) */}
        {!isPDF && (
          <>
            <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
              title="Color de anotación" />
            {[
              { t: TOOLS.pen,    icon: <Pencil size={13} />,  label: 'Pluma' },
              { t: TOOLS.rect,   icon: <Square size={13} />,  label: 'Rectángulo' },
              { t: TOOLS.eraser, icon: <Eraser size={13} />,  label: 'Borrar última' },
            ].map(({ t, icon, label }) => (
              <button key={t} onClick={() => setTool(tool === t ? TOOLS.none : t)}
                className="p-1.5 rounded-lg transition-colors" title={label}
                style={{
                  background: tool === t ? 'rgba(126,63,242,0.2)' : 'transparent',
                  color: tool === t ? '#9B5BFF' : '#8b8b9e',
                }}>
                {icon}
              </button>
            ))}
            <button onClick={undoLast} className="p-1.5 rounded-lg" title="Deshacer" style={{ color: '#8b8b9e' }}>
              <RotateCcw size={13} />
            </button>
            <button onClick={clearAnnotations} className="p-1.5 rounded-lg" title="Limpiar todo" style={{ color: '#8b8b9e' }}>
              <Trash2 size={13} />
            </button>
            <button onClick={saveAnnotations} className="p-1.5 rounded-lg flex items-center gap-1" title="Guardar anotaciones"
              style={{ color: savedAnn ? '#10b981' : '#7E3FF2' }}>
              {savedAnn ? <Check size={13} /> : <Check size={13} />}
            </button>
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </>
        )}

        {/* Edit meta / Delete */}
        <button onClick={onEdit} className="p-1.5 rounded-lg" title="Editar metadatos" style={{ color: '#8b8b9e' }}>
          <Edit3 size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg" title="Eliminar evidencia" style={{ color: '#f87171' }}>
          <Trash2 size={14} />
        </button>

        <button onClick={onClose} className="p-1.5 rounded-lg ml-1" style={{ color: '#8b8b9e' }}>
          <X size={16} />
        </button>
      </div>

      {/* Main view area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4"
        style={{ cursor: tool !== TOOLS.none ? 'crosshair' : 'default' }}>

        {isPDF ? (
          <embed
            src={fileUrl}
            type="application/pdf"
            className="rounded-xl shadow-2xl"
            style={{
              width: `${Math.min(900, 900 * zoom)}px`,
              height: `${600 * zoom}px`,
              maxWidth: '95vw',
            }}
          />
        ) : (
          <div className="relative" style={{ display: 'inline-block' }}>
            <img
              src={fileUrl}
              alt={evidence.title}
              draggable={false}
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                userSelect: 'none',
                display: 'block',
              }}
            />
            {/* Annotation canvas overlay */}
            <canvas
              ref={canvasRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{
                position: 'absolute',
                inset: 0,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                pointerEvents: tool !== TOOLS.none ? 'all' : 'none',
                cursor: tool !== TOOLS.none ? 'crosshair' : 'default',
              }}
              width={500}
              height={500}
            />
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center gap-4 px-4 py-2 shrink-0 text-[11px]"
        style={{ background: 'rgba(10,10,15,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#5a5a6e' }}>
        <span>{evidence.file_name}</span>
        <span>·</span>
        <span>{Math.round(evidence.file_size / 1024)} KB</span>
        {evidence.case_ref && <><span>·</span><span>Caso: {evidence.case_ref}</span></>}
        <span className="ml-auto">Ctrl+= / Ctrl+- para zoom</span>
      </div>
    </div>
  );
}
