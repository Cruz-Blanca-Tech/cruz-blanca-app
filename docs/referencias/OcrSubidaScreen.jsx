// Cruz Blanca — OCR Flujo: Paso 1 — Subir Documento

// ── Catálogo de actividades y sus documentos esperados ───────────────────
const PROGRAMAS = [
  { value: '', label: 'Selecciona un programa…' },
  { value: 'EDUCA', label: 'EDUCA' },
  { value: 'EN_FAMILIA', label: 'EN FAMILIA' },
];

const ACTIVIDADES = {
  EDUCA: [
    { value: 'EDUCA_2025_1', label: 'EDUCA 2025-1' },
    { value: 'EDUCA_2025_2', label: 'EDUCA 2025-2' },
  ],
  EN_FAMILIA: [
    { value: 'ENFAMILIA_2025_1', label: 'EN FAMILIA 2025-1' },
    { value: 'ENFAMILIA_2025_2', label: 'EN FAMILIA 2025-2' },
  ],
};

// Documentos esperados por actividad. Las imágenes EDUCA se reutilizan
// para 2025-1 y 2025-2; lo mismo para EN FAMILIA.
const DOC_EDUCA = [
  { id: 'dni_n',  nombre: 'DNI Niño',              sufijo: '_DNI_N',  img: 'assets/ejemplo_dni_nino.jpeg',          confidence_threshold: 0.90 },
  { id: 'dni_p',  nombre: 'DNI Papá',              sufijo: '_DNI_A',  img: 'assets/ejemplo_dni_papa.jpeg',          confidence_threshold: 0.90 },
  { id: 'dni_m',  nombre: 'DNI Mamá',              sufijo: '_DNI_A',  img: 'assets/ejemplo_dni_mama.jpeg',          confidence_threshold: 0.90 },
  { id: 'dj',     nombre: 'Declaración Jurada',    sufijo: '_DJ',     img: 'assets/ejemplo_declaracion_jurada.jpeg', confidence_threshold: 0.80 },
  { id: 'fins',   nombre: 'Ficha de Inscripción',  sufijo: '_FINS',   img: 'assets/ejemplo_ficha_inscripcion.jpeg', confidence_threshold: 0.85 },
];

const DOC_FAMILIA = [
  { id: 'med',    nombre: 'Ficha Médica',          sufijo: '_MED',    img: 'assets/ejemplo_ficha_medica.jpeg',      confidence_threshold: 0.85 },
];

const DOCS_POR_ACTIVIDAD = {
  EDUCA_2025_1:     DOC_EDUCA,
  EDUCA_2025_2:     DOC_EDUCA,
  ENFAMILIA_2025_1: DOC_FAMILIA,
  ENFAMILIA_2025_2: DOC_FAMILIA,
};

// Catálogo maestro de documentos disponibles al crear una actividad nueva.
// El año viene definido con cada documento (no editable).
const DOC_CATALOGO = [
  { id: 'fins',  nombre: 'Ficha de Inscripción', sufijo: '_FINS',  img: 'assets/ejemplo_ficha_inscripcion.jpeg', year: 2026 },
  { id: 'dni_a', nombre: 'DNI Apoderado',        sufijo: '_DNI_A', img: 'assets/ejemplo_dni_papa.jpeg',           year: 2026 },
  { id: 'dni_n', nombre: 'DNI Niño',             sufijo: '_DNI_N', img: 'assets/ejemplo_dni_nino.jpeg',           year: 2026 },
  { id: 'dj',    nombre: 'Declaración Jurada',   sufijo: '_DJ',    img: 'assets/ejemplo_declaracion_jurada.jpeg', year: 2026 },
  { id: 'med',   nombre: 'Ficha Médica',         sufijo: '_MED',   img: 'assets/ejemplo_ficha_medica.jpeg',       year: 2026 },
];

// Valor sentinela para la opción "crear actividad" en el select.
const CREAR_ACTIVIDAD = '__CREAR_ACTIVIDAD__';

// Diccionario maestro de sufijos (orden y uso del PDF)
const SUFIJOS = [
  { sufijo: '_FINS',  doc: 'Ficha de Inscripción', uso: 'Datos del niño, apoderado y programa.' },
  { sufijo: '_DNI_A', doc: 'DNI Apoderado',        uso: 'Identidad del tutor legal (anverso/reverso).' },
  { sufijo: '_DNI_N', doc: 'DNI Niño',             uso: 'Identidad del beneficiario.' },
  { sufijo: '_DJ',    doc: 'Declaración Jurada',   uso: 'DNI manual para validación cruzada.' },
  { sufijo: '_MED',   doc: 'Ficha Médica',         uso: 'Talla, peso y hemoglobina.' },
];

// ── Stepper ────────────────────────────────────────────────────────────────
function Stepper({ current }) {
  const steps = [
    { n: 1, label: 'Subir documento',        icon: 'upload'         },
    { n: 2, label: 'Extracción IA',           icon: 'scan'           },
    { n: 3, label: 'Revisión y corrección',   icon: 'pencil-line'    },
    { n: 4, label: 'Confirmación',            icon: 'check-circle'   },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => {
        const done    = s.n < current;
        const active  = s.n === current;
        const pending = s.n > current;

        const circleColor  = done ? CB_COLORS.success : active ? CB_COLORS.primary : '#CBD5E1';
        const circleBg     = done ? CB_COLORS.successLight : active ? '#E6EEF8' : '#F1F5F9';
        const labelColor   = done ? CB_COLORS.successDark : active ? CB_COLORS.primary : CB_COLORS.textMuted;
        const lineColor    = done ? CB_COLORS.success : '#E2E8F0';

        return (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: 'none' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: circleBg, border: `2px solid ${circleColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
              }}>
                {done
                  ? <Icon name="check" size={16} color={CB_COLORS.successDark} />
                  : <Icon name={s.icon} size={16} color={circleColor} />
                }
              </div>
              <div style={{
                fontFamily: "'Alegreya Sans', serif", fontSize: 12,
                fontWeight: active ? 500 : 400, color: labelColor,
                whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10, display: 'block', color: pending ? '#CBD5E1' : circleColor, marginBottom: 1 }}>Paso {s.n}</span>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: lineColor, margin: '0 10px', marginBottom: 22, transition: 'background .2s', minWidth: 24 }}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Dropzone ───────────────────────────────────────────────────────────────
function Dropzone({ file, onFile, onRemove }) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }

  function handleChange(e) {
    const f = e.target.files[0];
    if (f) onFile(f);
  }

  if (file) {
    const isImage = file.type.startsWith('image/');
    const ext = file.name.split('.').pop().toUpperCase();
    const sizeKB = (file.size / 1024).toFixed(0);

    return (
      <div style={{
        border: `1.5px solid ${CB_COLORS.success}`,
        borderRadius: 10, background: CB_COLORS.successLight,
        padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 22,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          background: isImage ? '#E2E8F0' : '#EBF5E9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${CB_COLORS.border}`,
        }}>
          {isImage
            ? <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : <Icon name={ext === 'PDF' ? 'file-text' : 'image'} size={24} color={CB_COLORS.successDark} />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500, color: CB_COLORS.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </div>
          <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted, marginTop: 2 }}>
            {ext} · {sizeKB} KB
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="check-circle" size={16} color={CB_COLORS.successDark} />
          <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.successDark }}>Listo</span>
        </div>

        <button onClick={onRemove} title="Eliminar archivo" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, borderRadius: 6, color: CB_COLORS.textMuted,
          display: 'flex', alignItems: 'center', transition: 'background .12s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <Icon name="x" size={16} color={CB_COLORS.error} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? CB_COLORS.primary : '#CBD5E1'}`,
        borderRadius: 10,
        background: dragging ? '#EAF1FB' : '#FAFBFC',
        padding: '40px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        cursor: 'pointer', transition: 'all .15s', marginBottom: 22,
        textAlign: 'center',
      }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: dragging ? '#D6E4F6' : '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .15s',
      }}>
        <Icon name="upload-cloud" size={24} color={dragging ? CB_COLORS.primary : '#94A3B8'} />
      </div>
      <div>
        <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 15, fontWeight: 500, color: CB_COLORS.textPrimary }}>
          Arrastra tu ficha escaneada o{' '}
          <span style={{ color: CB_COLORS.primary, textDecoration: 'underline' }}>haz clic para seleccionar</span>
        </div>
        <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted, marginTop: 6 }}>
          Formatos aceptados: <strong>JPG, PNG, PDF</strong> · Tamaño máximo: <strong>10 MB</strong>
        </div>
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={handleChange} />
    </div>
  );
}

// ── Select reutilizable ────────────────────────────────────────────────────
function Select({ label, value, onChange, options, required, disabled, hint }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{ display: 'block', fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textSecondary, marginBottom: 6 }}>
        {label} {required && <span style={{ color: CB_COLORS.error }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', height: 42,
            border: `1.5px solid ${value ? CB_COLORS.primary : CB_COLORS.border}`,
            borderRadius: 6,
            background: disabled ? '#F1F5F9' : 'white',
            fontFamily: "'Alegreya Sans', serif", fontSize: 14,
            color: disabled ? '#94A3B8' : (value ? CB_COLORS.textPrimary : CB_COLORS.textMuted),
            padding: '0 36px 0 12px', outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color .15s',
            appearance: 'none', WebkitAppearance: 'none',
          }}
          onFocus={e => { if (!disabled) e.target.style.borderColor = CB_COLORS.primary; }}
          onBlur={e => e.target.style.borderColor = value ? CB_COLORS.primary : CB_COLORS.border}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="chevron-down" size={16} color={disabled ? '#CBD5E1' : CB_COLORS.textMuted} />
        </span>
      </div>
      {hint && (
        <div style={{ marginTop: 6, fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ── Programa + Tipo de actividad ───────────────────────────────────────────
function ProgramaActividad({ programa, actividad, onPrograma, onActividad, customActivities }) {
  const customs = (customActivities[programa] || []).map(a => ({ value: a.value, label: a.label }));
  const actividadesDisponibles = programa
    ? [
        { value: '', label: 'Selecciona una actividad…' },
        ...ACTIVIDADES[programa],
        ...customs,
        { value: CREAR_ACTIVIDAD, label: '＋  Crear actividad nueva…' },
      ]
    : [{ value: '', label: 'Primero elige un programa' }];

  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
      <Select
        label="Programa"
        value={programa}
        onChange={onPrograma}
        options={PROGRAMAS}
        required
      />
      <Select
        label="Tipo de actividad"
        value={actividad}
        onChange={onActividad}
        options={actividadesDisponibles}
        required
        disabled={!programa}
      />
    </div>
  );
}

// ── Vista previa de documentos esperados ───────────────────────────────────
function DocumentosEjemplo({ actividad, docs, programaLabel, actividadLabel }) {
  const [hover, setHover] = React.useState(null);
  const [zoom, setZoom] = React.useState(null);

  if (!actividad || !docs) {
    return (
      <div style={{
        border: `1px dashed ${CB_COLORS.border}`,
        borderRadius: 10, padding: '22px 18px',
        background: '#FAFBFC',
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 24,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8, background: '#F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name="image" size={18} color="#94A3B8" />
        </div>
        <div>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textSecondary }}>
            Documentos esperados
          </div>
          <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, marginTop: 2 }}>
            Selecciona programa y actividad para ver qué documentos debe contener este expediente.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textSecondary }}>
            Documentos esperados <span style={{ color: CB_COLORS.textMuted, fontWeight: 400 }}>· {docs.length}</span>
          </div>
          <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, marginTop: 2 }}>
            Expediente típico para <strong>{actividadLabel}</strong>. Cada miniatura muestra una referencia visual del formato.
          </div>
        </div>
        <Badge type="primary" dot>{programaLabel}</Badge>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: docs.length === 1 ? 'minmax(0,1fr)' : `repeat(${Math.min(docs.length,5)}, minmax(0,1fr))`,
        gap: 10,
      }}>
        {docs.map((d, i) => {
          const isHover = hover === i;
          return (
            <div
              key={d.id}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setZoom(d)}
              style={{
                border: `1px solid ${isHover ? CB_COLORS.primary : CB_COLORS.border}`,
                borderRadius: 8, background: 'white', overflow: 'hidden',
                cursor: 'zoom-in', transition: 'border-color .15s, transform .15s, box-shadow .15s',
                transform: isHover ? 'translateY(-2px)' : 'none',
                boxShadow: isHover ? '0 4px 12px rgba(12,82,155,0.12)' : 'none',
              }}
            >
              <div style={{
                aspectRatio: docs.length === 1 ? '5/2' : '3/4',
                background: '#F1F5F9',
                position: 'relative', overflow: 'hidden',
              }}>
                <img
                  src={d.img}
                  alt={d.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                />
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(255,255,255,0.92)',
                  borderRadius: 4, padding: '2px 6px',
                  fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace',
                  fontSize: 10, fontWeight: 500, color: CB_COLORS.primary,
                  border: `1px solid ${CB_COLORS.border}`,
                }}>
                  {d.sufijo}
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isHover ? 'rgba(12,82,155,0.12)' : 'transparent',
                  transition: 'background .15s',
                  pointerEvents: 'none',
                }}>
                  {isHover && (
                    <div style={{
                      background: 'white', borderRadius: 999, padding: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    }}>
                      <Icon name="zoom-in" size={14} color={CB_COLORS.primary} />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 12.5, fontWeight: 500, color: CB_COLORS.textPrimary, lineHeight: 1.25 }}>
                  {d.nombre}
                </div>
                {typeof d.confidence_threshold === 'number' ? (
                  <div style={{ marginTop: 4 }}>
                    <Badge type="info" dot>min {Math.round(d.confidence_threshold * 100)}%</Badge>
                  </div>
                ) : (
                  <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10, color: CB_COLORS.textMuted, marginTop: 2 }}>
                    Documento {i + 1} de {docs.length}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom modal */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 32, cursor: 'zoom-out',
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 12, overflow: 'hidden',
            maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: `1px solid ${CB_COLORS.border}`,
            }}>
              <div>
                <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 15, fontWeight: 600, color: CB_COLORS.textPrimary }}>
                  {zoom.nombre}
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: CB_COLORS.primary, marginTop: 2 }}>
                  Sufijo: <strong>{zoom.sufijo}</strong>
                </div>
              </div>
              <button onClick={() => setZoom(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                borderRadius: 6, color: CB_COLORS.textMuted, display: 'flex',
              }}>
                <Icon name="x" size={18} color={CB_COLORS.textMuted} />
              </button>
            </div>
            <img src={zoom.img} alt={zoom.nombre} style={{
              maxWidth: '80vw', maxHeight: 'calc(90vh - 60px)', objectFit: 'contain', background: '#0F172A',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Convención de nombres de archivo ───────────────────────────────────────
function NombresArchivo({ actividad, docs }) {
  const dniDemo = '78076548';

  // Sufijos relevantes: si hay actividad, mostrar los suyos; si no, todos.
  const sufijosRelevantes = docs
    ? SUFIJOS.filter(s => docs.some(d => d.sufijo === s.sufijo))
    : SUFIJOS;

  return (
    <div style={{
      border: `1px solid ${CB_COLORS.border}`,
      borderRadius: 10, background: '#FAFBFC',
      padding: '16px 18px', marginBottom: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, background: '#E6EEF8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="file-cog" size={14} color={CB_COLORS.primary} />
        </div>
        <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 14, fontWeight: 600, color: CB_COLORS.textPrimary }}>
          Convención de nombres de archivo
        </div>
        <div style={{ flex: 1 }}></div>
        <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: CB_COLORS.textMuted, letterSpacing: '.04em' }}>
          Enrutamiento automático
        </div>
      </div>

      <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textSecondary, lineHeight: 1.55, marginBottom: 12 }}>
        El backend enruta cada archivo según su nombre. Usa la sintaxis:
      </div>

      {/* Pattern */}
      <div style={{
        background: 'white', border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
        padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center',
        gap: 8, flexWrap: 'wrap',
      }}>
        <code style={{
          fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace', fontSize: 13,
          color: CB_COLORS.textPrimary, fontWeight: 500,
        }}>
          <span style={{ color: CB_COLORS.purple }}>[DNI_BENEFICIARIO]</span>
          <span style={{ color: CB_COLORS.textMuted }}>_</span>
          <span style={{ color: CB_COLORS.warningDark }}>[SUFIJO]</span>
          <span style={{ color: CB_COLORS.textMuted }}>.</span>
          <span style={{ color: CB_COLORS.successDark }}>[EXT]</span>
        </code>
        <span style={{ color: CB_COLORS.textMuted, fontFamily: "'Arimo', sans-serif", fontSize: 11 }}>→ ejemplo:</span>
        <code style={{
          fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace', fontSize: 13,
          background: '#E6EEF8', color: CB_COLORS.primaryDark,
          padding: '3px 8px', borderRadius: 4, fontWeight: 500,
        }}>
          {dniDemo}_DNI_N.pdf
        </code>
      </div>

      {/* Tabla de sufijos */}
      <div style={{ borderRadius: 6, overflow: 'hidden', border: `1px solid ${CB_COLORS.border}` }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '120px 1fr 1.4fr',
          background: '#F1F5F9', padding: '8px 12px', gap: 12,
          fontFamily: "'Arimo', sans-serif", fontSize: 10.5, fontWeight: 600,
          color: CB_COLORS.textSecondary, letterSpacing: '.06em', textTransform: 'uppercase',
        }}>
          <div>Sufijo</div>
          <div>Documento</div>
          <div>Uso</div>
        </div>
        {sufijosRelevantes.map((s, i) => {
          const inActividad = docs && docs.some(d => d.sufijo === s.sufijo);
          return (
            <div key={s.sufijo} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 1.4fr',
              padding: '8px 12px', gap: 12,
              borderTop: i === 0 ? 'none' : `1px solid ${CB_COLORS.border}`,
              background: 'white',
              alignItems: 'center',
            }}>
              <code style={{
                fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace', fontSize: 12,
                color: CB_COLORS.warningDark, fontWeight: 600,
                background: CB_COLORS.warningLight, padding: '2px 7px', borderRadius: 4,
                display: 'inline-block', width: 'fit-content',
              }}>
                {s.sufijo}
              </code>
              <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 12.5, color: CB_COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.doc}
                {inActividad && <Badge type="success" dot>requerido</Badge>}
              </div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, lineHeight: 1.45 }}>
                {s.uso}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8,
        fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, lineHeight: 1.5,
      }}>
        <Icon name="info" size={13} color={CB_COLORS.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
        <span>
          El <strong>DNI</strong> agrupa todos los archivos de un mismo beneficiario en un expediente.
          El <strong>sufijo</strong> determina qué modelo de IA se invoca para extraer datos.
        </span>
      </div>
    </div>
  );
}

// ── Help note ──────────────────────────────────────────────────────────────
function HelpNote() {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8,
      background: CB_COLORS.infoLight, border: `1px solid ${CB_COLORS.info}33`,
      marginBottom: 22,
    }}>
      <Icon name="lightbulb" size={15} color={CB_COLORS.infoDark} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.infoDark, lineHeight: 1.55 }}>
        <strong>Para mejores resultados:</strong> asegúrate de que la ficha esté bien iluminada, sin sombras y con resolución mínima de 200 DPI. Las fichas muy inclinadas o con texto manuscrito ilegible reducen la confianza del OCR.
      </div>
    </div>
  );
}

// ── Modal: Crear actividad nueva ───────────────────────────────────────────
function CrearActividadModal({ programaLabel, onClose, onSave }) {
  const [nombre, setNombre] = React.useState('');
  const [rows, setRows] = React.useState(
    DOC_CATALOGO.map(d => ({ ...d, selected: false, threshold: 85 }))
  );
  const [touched, setTouched] = React.useState(false);
  const [zoom, setZoom] = React.useState(null);

  function toggle(id) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  }
  function setThreshold(id, val) {
    setRows(rs => rs.map(r => r.id === id ? { ...r, threshold: val } : r));
  }

  const seleccionados = rows.filter(r => r.selected);
  const canSave = nombre.trim().length > 0 && seleccionados.length > 0;

  function handleSave() {
    setTouched(true);
    if (!canSave) return;
    onSave({
      value: 'CUSTOM_' + Date.now(),
      label: nombre.trim(),
      docs: seleccionados.map(d => ({
        id: d.id, nombre: d.nombre, sufijo: d.sufijo, img: d.img,
        year: d.year,
        confidence_threshold: +(d.threshold / 100).toFixed(2),
      })),
    });
  }

  // Color del umbral según severidad
  function thColor(v) {
    if (v >= 90) return CB_COLORS.success;
    if (v >= 75) return CB_COLORS.info;
    return CB_COLORS.warning;
  }

  return (
    <React.Fragment>
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 28,
      }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 12, overflow: 'hidden',
        width: 'min(620px, 96vw)', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${CB_COLORS.border}`, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E6EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="folder-plus" size={17} color={CB_COLORS.primary} />
            </div>
            <div>
              <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 16, fontWeight: 600, color: CB_COLORS.textPrimary }}>
                Crear actividad nueva
              </div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, marginTop: 1 }}>
                Programa: <strong>{programaLabel}</strong>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 6,
            borderRadius: 6, color: CB_COLORS.textMuted, display: 'flex',
          }}>
            <Icon name="x" size={18} color={CB_COLORS.textMuted} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto' }}>
          {/* Nombre */}
          <label style={{ display: 'block', fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textSecondary, marginBottom: 6 }}>
            Nombre de la actividad <span style={{ color: CB_COLORS.error }}>*</span>
          </label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej. EDUCA 2026-1"
            style={{
              width: '100%', height: 42, borderRadius: 6,
              border: `1.5px solid ${touched && !nombre.trim() ? CB_COLORS.error : (nombre ? CB_COLORS.primary : CB_COLORS.border)}`,
              padding: '0 12px', outline: 'none',
              fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textPrimary,
            }}
            onFocus={e => e.target.style.borderColor = CB_COLORS.primary}
            onBlur={e => e.target.style.borderColor = nombre ? CB_COLORS.primary : CB_COLORS.border}
          />

          {/* Documentos */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '20px 0 8px' }}>
            <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textSecondary }}>
              Documentos obligatorios <span style={{ color: CB_COLORS.error }}>*</span>
            </div>
            <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted }}>
              {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'}
            </div>
          </div>
          <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
            Marca los documentos que debe contener el expediente. El año viene definido con cada
            documento; para cada uno define el <strong>umbral de confianza</strong>: si el OCR supera ese
            valor, el documento se aprueba automáticamente; por debajo, pasa a corrección manual.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(d => {
              const sel = d.selected;
              return (
                <div key={d.id} style={{
                  border: `1.5px solid ${sel ? CB_COLORS.primary : CB_COLORS.border}`,
                  borderRadius: 8, background: sel ? '#F7FAFD' : 'white',
                  transition: 'border-color .12s, background .12s',
                }}>
                  {/* Fila seleccionable */}
                  <div onClick={() => toggle(d.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                      border: `1.5px solid ${sel ? CB_COLORS.primary : '#CBD5E1'}`,
                      background: sel ? CB_COLORS.primary : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sel && <Icon name="check" size={13} color="white" />}
                    </div>
                    <div
                      onClick={e => { e.stopPropagation(); setZoom(d); }}
                      title="Ampliar"
                      style={{ width: 36, height: 44, borderRadius: 5, overflow: 'hidden', flexShrink: 0, border: `1px solid ${CB_COLORS.border}`, background: '#F1F5F9', cursor: 'zoom-in', position: 'relative' }}>
                      <img src={d.img} alt={d.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                      <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(255,255,255,0.92)', borderRadius: 3, padding: 1, display: 'flex', border: `1px solid ${CB_COLORS.border}` }}>
                        <Icon name="zoom-in" size={9} color={CB_COLORS.primary} />
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textPrimary }}>{d.nombre}</span>
                        <code style={{
                          fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10.5, fontWeight: 600,
                          color: CB_COLORS.warningDark, background: CB_COLORS.warningLight,
                          padding: '1px 6px', borderRadius: 4,
                        }}>{d.sufijo}</code>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted }}>Año</span>
                        <span style={{
                          fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, color: CB_COLORS.textSecondary,
                          background: '#F1F5F9', border: `1px solid ${CB_COLORS.border}`,
                          padding: '1px 8px', borderRadius: 4,
                        }}>{d.year}</span>
                      </div>
                    </div>
                  </div>

                  {/* Umbral de confianza (solo si está seleccionado) */}
                  {sel && (
                    <div onClick={e => e.stopPropagation()} style={{
                      borderTop: `1px solid ${CB_COLORS.border}`, padding: '10px 12px 12px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textSecondary, whiteSpace: 'nowrap' }}>
                        Umbral de confianza
                      </div>
                      <input
                        type="range" min={50} max={99} step={1} value={d.threshold}
                        onChange={e => setThreshold(d.id, +e.target.value)}
                        style={{ flex: 1, accentColor: thColor(d.threshold), cursor: 'pointer' }}
                      />
                      <div style={{
                        fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, fontWeight: 600,
                        color: thColor(d.threshold), width: 48, textAlign: 'right',
                      }}>
                        {d.threshold}%
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {touched && !canSave && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.errorDark }}>
              <Icon name="alert-circle" size={13} color={CB_COLORS.errorDark} />
              {!nombre.trim() ? 'Ingresa un nombre para la actividad.' : 'Selecciona al menos un documento obligatorio.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
          borderTop: `1px solid ${CB_COLORS.border}`, background: '#FAFBFC', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            background: 'white', border: `1.5px solid ${CB_COLORS.border}`, cursor: 'pointer',
            fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500, color: CB_COLORS.textSecondary,
            padding: '8px 18px', borderRadius: 6,
          }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!canSave} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: canSave ? CB_COLORS.primary : '#E2E8F0', color: canSave ? 'white' : '#94A3B8',
            border: 'none', cursor: canSave ? 'pointer' : 'not-allowed',
            fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500,
            padding: '8px 20px', borderRadius: 6,
          }}>
            <Icon name="check" size={15} color={canSave ? 'white' : '#94A3B8'} />
            Crear actividad
          </button>
        </div>
      </div>
    </div>

    {/* Zoom de documento */}
    {zoom && (
      <div
        onClick={() => setZoom(null)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.86)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: 32, cursor: 'zoom-out',
        }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: 'white', borderRadius: 12, overflow: 'hidden',
          maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${CB_COLORS.border}`,
          }}>
            <div>
              <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 15, fontWeight: 600, color: CB_COLORS.textPrimary }}>
                {zoom.nombre}
              </div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: CB_COLORS.primary, marginTop: 2 }}>
                Sufijo: <strong>{zoom.sufijo}</strong>
              </div>
            </div>
            <button onClick={() => setZoom(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6,
              borderRadius: 6, color: CB_COLORS.textMuted, display: 'flex',
            }}>
              <Icon name="x" size={18} color={CB_COLORS.textMuted} />
            </button>
          </div>
          <img src={zoom.img} alt={zoom.nombre} style={{
            maxWidth: '80vw', maxHeight: 'calc(90vh - 60px)', objectFit: 'contain', background: '#0F172A',
          }} />
        </div>
      </div>
    )}
    </React.Fragment>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
function OcrSubidaScreen() {
  const [active, setActive] = React.useState('carga');
  const [file, setFile] = React.useState(null);
  const [programa, setPrograma] = React.useState('');
  const [actividad, setActividad] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [customActivities, setCustomActivities] = React.useState({});
  const [modalOpen, setModalOpen] = React.useState(false);

  function handlePrograma(p) {
    setPrograma(p);
    setActividad(''); // reset actividad cuando cambia programa
  }

  function handleActividad(v) {
    if (v === CREAR_ACTIVIDAD) { setModalOpen(true); return; }
    setActividad(v);
  }

  function handleCrearActividad(nueva) {
    setCustomActivities(prev => ({
      ...prev,
      [programa]: [...(prev[programa] || []), nueva],
    }));
    setActividad(nueva.value);
    setModalOpen(false);
  }

  const programaLabel = PROGRAMAS.find(p => p.value === programa)?.label || '';
  const actividadLabel =
    (ACTIVIDADES[programa] || []).find(a => a.value === actividad)?.label ||
    (customActivities[programa] || []).find(a => a.value === actividad)?.label || '';

  // Documentos de la actividad activa (predefinida o personalizada)
  const docsActuales = !actividad
    ? null
    : (DOCS_POR_ACTIVIDAD[actividad] ||
       (customActivities[programa] || []).find(a => a.value === actividad)?.docs ||
       null);

  const canProceed = file && programa && actividad;

  function handleIniciar() {
    if (!canProceed) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  // Mensaje de validación dinámico
  let pendingMsg = null;
  if (!canProceed) {
    const missing = [];
    if (!file) missing.push('archivo');
    if (!programa) missing.push('programa');
    if (!actividad) missing.push('actividad');
    pendingMsg = `Falta seleccionar: ${missing.join(', ')}`;
  }

  return (
    <AppShell
      active={active}
      onNavigate={setActive}
      title="OCR / Digitalización"
      subtitle="Extracción automática de datos desde fichas físicas"
      user={{ name: 'Carmen Huamán', role: 'Operativo' }}
    >
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 26, fontWeight: 700, color: CB_COLORS.textPrimary }}>Nueva Digitalización</div>
        <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textMuted, marginTop: 2 }}>Carga una ficha escaneada para extraer sus datos automáticamente</div>
      </div>

      <Stepper current={1} />

      <Card style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 16, fontWeight: 600, color: CB_COLORS.textPrimary, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E6EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="upload" size={13} color={CB_COLORS.primary} />
          </div>
          Subir documento
        </div>

        <Dropzone file={file} onFile={setFile} onRemove={() => setFile(null)} />

        <ProgramaActividad
          programa={programa}
          actividad={actividad}
          onPrograma={handlePrograma}
          onActividad={handleActividad}
          customActivities={customActivities}
        />

        <DocumentosEjemplo
          actividad={actividad}
          docs={docsActuales}
          programaLabel={programaLabel}
          actividadLabel={actividadLabel}
        />

        <NombresArchivo actividad={actividad} docs={docsActuales} />

        <HelpNote />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${CB_COLORS.border}` }}>
          <button style={{ background: 'none', border: 'none', cursor: 'not-allowed', fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 6 }} disabled>
            <Icon name="arrow-left" size={14} color="#CBD5E1" />
            Anterior
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {pendingMsg && (
              <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted }}>
                {pendingMsg}
              </span>
            )}
            <button
              onClick={handleIniciar}
              disabled={!canProceed || loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 6, border: 'none',
                background: canProceed ? CB_COLORS.primary : '#E2E8F0',
                color: canProceed ? 'white' : '#94A3B8',
                fontFamily: "'Alegreya Sans', serif", fontSize: 15, fontWeight: 500,
                cursor: canProceed ? 'pointer' : 'not-allowed',
                transition: 'all .15s', opacity: loading ? 0.8 : 1,
              }}
              onMouseEnter={e => { if (canProceed && !loading) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1'; }}>
              {loading
                ? <><Icon name="loader" size={15} color="white" /> Procesando…</>
                : <><Icon name="scan" size={15} color={canProceed ? 'white' : '#94A3B8'} /> Iniciar extracción</>
              }
            </button>
          </div>
        </div>
      </Card>

      {modalOpen && (
        <CrearActividadModal
          programaLabel={programaLabel}
          onClose={() => setModalOpen(false)}
          onSave={handleCrearActividad}
        />
      )}
    </AppShell>
  );
}

Object.assign(window, { OcrSubidaScreen });
