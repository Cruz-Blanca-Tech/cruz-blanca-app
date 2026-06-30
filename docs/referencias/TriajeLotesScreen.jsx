// Cruz Blanca — Bandeja de triaje por lotes

const LOTES = [
  {
    id: 'L-2026-0144',
    fecha: '07 may 2026, 14:48',
    fechaRel: 'hace instantes',
    programa: 'EDUCA', programaColor: '#C83C3E', programaLight: '#FDEAEA',
    actividad: 'EDUCA 2025-2',
    descripcion: 'Fichas de inscripción · taller de robótica, sede Sur',
    archivos: 11,
    estado: 'PENDING',
    autor: 'Carmen Huamán',
  },
  {
    id: 'L-2026-0143',
    fecha: '07 may 2026, 14:40',
    fechaRel: 'hace 1 min',
    programa: 'EDUCA', programaColor: '#C83C3E', programaLight: '#FDEAEA',
    actividad: 'EDUCA 2025-2',
    descripcion: 'Fichas de inscripción · taller de matemáticas, sede Norte',
    archivos: 9,
    estado: 'PROCESSING',
    progreso: 12,
    autor: 'Carmen Huamán',
  },
  {
    id: 'L-2026-0142',
    fecha: '07 may 2026, 14:32',
    fechaRel: 'hace 3 min',
    programa: 'EDUCA', programaColor: '#C83C3E', programaLight: '#FDEAEA',
    actividad: 'EDUCA 2025-1',
    descripcion: 'Fichas de inscripción · taller de lectura, sede San Juan',
    archivos: 5,
    estado: 'PROCESSING',
    progreso: 35,
    autor: 'Carmen Huamán',
  },
  {
    id: 'L-2026-0141',
    fecha: '07 may 2026, 14:18',
    fechaRel: 'hace 17 min',
    programa: 'EN FAMILIA', programaColor: '#625696', programaLight: '#EEEAF7',
    actividad: 'EN FAMILIA 2025-2',
    descripcion: 'Padrón de beneficiarios · jornada escolar marzo',
    archivos: 15,
    estado: 'COMPLETED',
    progreso: 100,
    autor: 'José Ramírez',
    revisar: 12, // expedientes que requieren triaje humano
    aprobAuto: 48, requiereTriaje: 12, aprobManual: 0, rechazManual: 0,
  },
  {
    id: 'L-2026-0140',
    fecha: '07 may 2026, 11:04',
    fechaRel: 'hace 3 h',
    programa: 'EDUCA', programaColor: '#C83C3E', programaLight: '#FDEAEA',
    actividad: 'EDUCA 2025-1',
    descripcion: 'Fichas de afiliación familiar · campaña Q1',
    archivos: 4,
    estado: 'COMPLETED',
    progreso: 100,
    autor: 'Carmen Huamán',
    revisar: 4,
    aprobAuto: 15, requiereTriaje: 4, aprobManual: 0, rechazManual: 0,
  },
  {
    id: 'L-2026-0139',
    fecha: '06 may 2026, 17:42',
    fechaRel: 'ayer',
    programa: 'EN FAMILIA', programaColor: '#625696', programaLight: '#EEEAF7',
    actividad: 'EN FAMILIA 2025-1',
    descripcion: 'Ficha socioeconómica · visita domiciliaria',
    archivos: 8,
    estado: 'FINALIZED',
    progreso: 100,
    autor: 'Lucía Vega',
    revisar: 0,
    aprobAuto: 31, requiereTriaje: 0, aprobManual: 7, rechazManual: 2,
  },
  {
    id: 'L-2026-0138',
    fecha: '06 may 2026, 09:15',
    fechaRel: 'ayer',
    programa: 'EDUCA', programaColor: '#C83C3E', programaLight: '#FDEAEA',
    actividad: 'EDUCA 2025-2',
    descripcion: 'Actualización de datos · beneficiarios activos',
    archivos: 6,
    estado: 'FINALIZED',
    progreso: 100,
    autor: 'Carmen Huamán',
    revisar: 0,
    aprobAuto: 19, requiereTriaje: 0, aprobManual: 4, rechazManual: 1,
  },
  {
    id: 'L-2026-0137',
    fecha: '05 may 2026, 16:20',
    fechaRel: 'hace 2 d',
    programa: 'EN FAMILIA', programaColor: '#625696', programaLight: '#EEEAF7',
    actividad: 'EN FAMILIA 2025-2',
    descripcion: 'Fichas de visita · sector rural, escaneo ilegible',
    archivos: 6,
    estado: 'REJECTED',
    autor: 'José Ramírez',
    motivoRechazo: 'Calidad de escaneo insuficiente',
  },
  {
    id: 'L-2026-0136',
    fecha: '05 may 2026, 09:48',
    fechaRel: 'hace 2 d',
    programa: 'EDUCA', programaColor: '#C83C3E', programaLight: '#FDEAEA',
    actividad: 'EDUCA 2025-1',
    descripcion: 'Padrón escolar · carga interrumpida',
    archivos: 3,
    estado: 'FAILED',
    autor: 'Lucía Vega',
    motivoError: 'Sin conexión con el servidor de OCR',
  },
];

function ProgramaBadge({ label, color, light }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px', borderRadius: 4,
      background: light, color: color,
      fontFamily: "'Alegreya Sans', serif", fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }}></span>
      {label}
    </span>
  );
}

const ESTADO_CFG = {
  PENDING:    { label: 'PENDIENTE',  icon: 'clock',          color: '#5B6B7E',             bg: '#EEF1F5',                spin: false },
  PROCESSING: { label: 'PROCESANDO', icon: 'loader',         color: CB_COLORS.warningDark, bg: CB_COLORS.warningLight,   spin: true },
  COMPLETED:  { label: 'COMPLETADO', icon: 'clipboard-list', color: CB_COLORS.primaryDark, bg: '#E6EEF8',                spin: false },
  FINALIZED:  { label: 'FINALIZADO', icon: 'check-circle',   color: CB_COLORS.successDark, bg: CB_COLORS.successLight,   spin: false },
  REJECTED:   { label: 'RECHAZADO',  icon: 'x-circle',       color: CB_COLORS.errorDark,   bg: CB_COLORS.errorLight,     spin: false },
  FAILED:     { label: 'ERROR',      icon: 'alert-octagon',  color: '#9A4A12',             bg: '#FBEAD7',                spin: false },
};

function EstadoBadge({ estado }) {
  const c = ESTADO_CFG[estado] || ESTADO_CFG.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4,
      background: c.bg, color: c.color,
      fontFamily: "'Arimo', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: '.04em',
    }}>
      <Icon name={c.icon} size={11} color={c.color} style={c.spin ? { animation: 'spin 1.4s linear infinite' } : undefined} />
      {c.label}
    </span>
  );
}

function ExpChip({ icon, n, color, bg, title }) {
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 4, background: bg, cursor: 'default',
    }}>
      <Icon name={icon} size={11} color={color} />
      <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, fontWeight: 700, color }}>{n}</span>
    </span>
  );
}

function DesgloseExpedientes({ l }) {
  if (l.estado === 'PENDING') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, fontStyle: 'italic' }}>
        <Icon name="clock" size={12} color={CB_COLORS.textMuted} />
        En cola de procesamiento
      </span>
    );
  }
  if (l.estado === 'PROCESSING') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.warningDark, fontStyle: 'italic' }}>
        <Icon name="loader" size={12} color={CB_COLORS.warningDark} style={{ animation: 'spin 1.4s linear infinite' }} />
        La IA está leyendo los PDFs…
      </span>
    );
  }
  if (l.estado === 'REJECTED') {
    return (
      <span title={l.motivoRechazo} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.errorDark, fontStyle: 'italic' }}>
        <Icon name="x-circle" size={12} color={CB_COLORS.errorDark} />
        Lote descartado
      </span>
    );
  }
  if (l.estado === 'FAILED') {
    return (
      <span title={l.motivoError} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: '#9A4A12', fontStyle: 'italic' }}>
        <Icon name="alert-octagon" size={12} color="#9A4A12" />
        {l.motivoError}
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      <ExpChip icon="zap"            n={l.aprobAuto}      color={CB_COLORS.successDark} bg={CB_COLORS.successLight} title="Aprobados automáticamente" />
      <ExpChip icon="alert-triangle" n={l.requiereTriaje} color={CB_COLORS.warningDark} bg={CB_COLORS.warningLight} title="Requieren triaje" />
      <ExpChip icon="user-check"     n={l.aprobManual}    color={CB_COLORS.primaryDark} bg="#E6EEF8"               title="Aprobados manualmente" />
      <ExpChip icon="user-x"         n={l.rechazManual}   color={CB_COLORS.errorDark}   bg={CB_COLORS.errorLight}   title="Rechazados manualmente" />
    </div>
  );
}

function LoteRow({ l }) {
  const completed = l.estado === 'COMPLETED';
  const finalizado = l.estado === 'FINALIZED';
  return (
    <tr style={{ borderBottom: `1px solid ${CB_COLORS.border}` }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFD'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
      <td style={tdStyle}>
        <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12.5, color: CB_COLORS.textPrimary, fontWeight: 500 }}>{l.fecha}</div>
        <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, marginTop: 2 }}>{l.fechaRel} · por {l.autor}</div>
      </td>
      <td style={tdStyle}>
        <ProgramaBadge label={l.programa} color={l.programaColor} light={l.programaLight} />
      </td>
      <td style={{ ...tdStyle, maxWidth: 240 }}>
        <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500, color: CB_COLORS.textPrimary }}>{l.actividad}</div>
        <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, marginTop: 2, lineHeight: 1.35 }}>{l.descripcion}</div>
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="files" size={13} color={CB_COLORS.textMuted} />
          <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 13, color: CB_COLORS.textPrimary, fontWeight: 500 }}>{l.archivos}</span>
        </div>
      </td>
      <td style={tdStyle}>
        <DesgloseExpedientes l={l} />
      </td>
      <td style={tdStyle}>
        <EstadoBadge estado={l.estado} />
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {completed ? (
          <a href='TriajeDetalleLote.html' style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 5,
            background: CB_COLORS.primary, color: 'white',
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer',
            transition: 'opacity .15s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Icon name="pencil-line" size={13} color="white" />
            Revisar
            {l.revisar > 0 && (
              <span style={{
                background: 'rgba(255,255,255,0.22)', color: 'white',
                padding: '0 6px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              }}>{l.revisar}</span>
            )}
          </a>
        ) : finalizado ? (
          <a href='TriajeDetalleLote.html' style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 5,
            background: CB_COLORS.successLight, color: CB_COLORS.successDark,
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            textDecoration: 'none', cursor: 'pointer',
            transition: 'opacity .15s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.82'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Icon name="check" size={13} color={CB_COLORS.successDark} />
            Revisado
          </a>
        ) : l.estado === 'REJECTED' ? (
          <span title={l.motivoRechazo} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 5,
            background: CB_COLORS.errorLight, color: CB_COLORS.errorDark,
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            whiteSpace: 'nowrap', cursor: 'default',
          }}>
            <Icon name="x-circle" size={13} color={CB_COLORS.errorDark} />
            Rechazado
          </span>
        ) : l.estado === 'FAILED' ? (
          <button title={l.motivoError} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 5, border: '1px solid #E2B58A',
            background: '#FBEAD7', color: '#9A4A12',
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.82'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Icon name="refresh-cw" size={13} color="#9A4A12" />
            Reintentar
          </button>
        ) : l.estado === 'PROCESSING' ? (
          <button disabled style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 5, border: 'none',
            background: '#F1F5F9', color: '#94A3B8',
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            cursor: 'not-allowed', whiteSpace: 'nowrap',
          }}>
            <Icon name="loader" size={13} color="#94A3B8" style={{ animation: 'spin 1.4s linear infinite' }} />
            Procesando…
          </button>
        ) : (
          <button disabled style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 5, border: 'none',
            background: '#F1F5F9', color: '#94A3B8',
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            cursor: 'not-allowed', whiteSpace: 'nowrap',
          }}>
            <Icon name="clock" size={13} color="#94A3B8" />
            En cola
          </button>
        )}
      </td>
    </tr>
  );
}

const tdStyle = {
  padding: '14px 16px', verticalAlign: 'middle',
  fontFamily: "'Alegreya Sans', serif",
};

const thStyle = {
  padding: '11px 16px',
  fontFamily: "'Arimo', sans-serif", fontSize: 10.5, fontWeight: 600,
  color: CB_COLORS.textSecondary, letterSpacing: '.06em', textTransform: 'uppercase',
  textAlign: 'left', background: '#F8FAFC',
  borderBottom: `1px solid ${CB_COLORS.border}`,
};

function FilterSelect({ icon, value, onChange, options }) {
  const isDefault = value === 'todos';
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flex: '1 1 0', minWidth: 170 }}>
      <span style={{ position: 'absolute', left: 11, pointerEvents: 'none', zIndex: 1 }}>
        <Icon name={icon} size={14} color={isDefault ? CB_COLORS.textMuted : CB_COLORS.primary} />
      </span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        width: '100%', padding: '8px 30px 8px 33px', borderRadius: 6,
        border: `1px solid ${isDefault ? CB_COLORS.border : CB_COLORS.primary}`,
        background: isDefault ? 'white' : '#F4F8FD',
        fontFamily: "'Alegreya Sans', serif", fontSize: 13,
        color: isDefault ? CB_COLORS.textSecondary : CB_COLORS.primaryDark,
        fontWeight: isDefault ? 400 : 500,
        cursor: 'pointer', outline: 'none',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}>
        <Icon name="chevron-down" size={14} color={CB_COLORS.textMuted} />
      </span>
    </div>
  );
}

function TriajeLotesScreen() {
  const [navActive, setNavActive] = React.useState('triaje');
  const [fPrograma, setFPrograma] = React.useState('todos');
  const [fActividad, setFActividad] = React.useState('todos');
  const [fEstado, setFEstado] = React.useState('todos');

  const programaOpts = [
    { value: 'todos', label: 'Todos los programas' },
    ...[...new Set(LOTES.map(l => l.programa))].map(p => ({ value: p, label: p })),
  ];
  const actividadOpts = [
    { value: 'todos', label: 'Todas las actividades' },
    ...[...new Set(LOTES.map(l => l.actividad))].map(a => ({ value: a, label: a })),
  ];
  const estadoOpts = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'PROCESSING', label: 'Procesando' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'FINALIZED', label: 'Finalizado' },
    { value: 'REJECTED', label: 'Rechazado' },
    { value: 'FAILED', label: 'Con error' },
  ];

  const filtered = LOTES.filter(l =>
    (fPrograma === 'todos' || l.programa === fPrograma) &&
    (fActividad === 'todos' || l.actividad === fActividad) &&
    (fEstado === 'todos' || l.estado === fEstado)
  );

  const hasFilters = fPrograma !== 'todos' || fActividad !== 'todos' || fEstado !== 'todos';
  const limpiar = () => { setFPrograma('todos'); setFActividad('todos'); setFEstado('todos'); };

  const counts = {
    todos: LOTES.length,
    pending: LOTES.filter(l => l.estado === 'PENDING').length,
    processing: LOTES.filter(l => l.estado === 'PROCESSING').length,
    completed: LOTES.filter(l => l.estado === 'COMPLETED').length,
    finalized: LOTES.filter(l => l.estado === 'FINALIZED').length,
    rejected: LOTES.filter(l => l.estado === 'REJECTED').length,
    failed: LOTES.filter(l => l.estado === 'FAILED').length,
  };

  return (
    <AppShell
      active={navActive}
      onNavigate={setNavActive}
      title="Cargar"
      subtitle="Bandeja de triaje de lotes digitalizados"
      user={{ name: 'Carmen Huamán', role: 'Operativo' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 26, fontWeight: 700, color: CB_COLORS.textPrimary }}>Bandeja de triaje</div>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textMuted, marginTop: 2 }}>
            Lotes de documentos enviados al motor de OCR. Revisa los que estén pendientes de revisión.
          </div>
        </div>
        <a href="OCR Paso 1.html" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '10px 18px', borderRadius: 6, border: 'none',
          background: CB_COLORS.primary, color: 'white',
          fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500,
          textDecoration: 'none', cursor: 'pointer', transition: 'opacity .15s', whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <Icon name="plus" size={14} color="white" />
          Cargar nuevo lote
        </a>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { key: 'todos',      label: 'Total de lotes',  value: counts.todos,      icon: 'layers',         color: CB_COLORS.primary,     bg: '#E6EEF8' },
          { key: 'pending',    label: 'Pendientes',      value: counts.pending,    icon: 'clock',          color: '#5B6B7E',             bg: '#EEF1F5' },
          { key: 'processing', label: 'Procesando',      value: counts.processing, icon: 'loader',         color: CB_COLORS.warningDark, bg: CB_COLORS.warningLight },
          { key: 'completed',  label: 'Por revisar',     value: counts.completed,  icon: 'clipboard-list', color: CB_COLORS.primaryDark, bg: '#E6EEF8' },
          { key: 'finalized',  label: 'Finalizados',     value: counts.finalized,  icon: 'check-circle',   color: CB_COLORS.successDark, bg: CB_COLORS.successLight },
          { key: 'rejected',   label: 'Rechazados',      value: counts.rejected,   icon: 'x-circle',       color: CB_COLORS.errorDark,   bg: CB_COLORS.errorLight },
          { key: 'failed',     label: 'Con error',       value: counts.failed,     icon: 'alert-octagon',  color: '#9A4A12',             bg: '#FBEAD7' },
        ].map(k => (
          <Card key={k.key} padding={14} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={k.icon} size={18} color={k.color} />
            </div>
            <div>
              <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 24, fontWeight: 700, color: CB_COLORS.textPrimary, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, marginTop: 3 }}>{k.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <FilterSelect icon="tag"      value={fPrograma}  onChange={setFPrograma}  options={programaOpts} />
        <FilterSelect icon="folder"   value={fActividad} onChange={setFActividad} options={actividadOpts} />
        <FilterSelect icon="activity" value={fEstado}    onChange={setFEstado}    options={estadoOpts} />
        {hasFilters && (
          <button onClick={limpiar} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 6, border: `1px solid ${CB_COLORS.border}`,
            background: 'white', color: CB_COLORS.textSecondary,
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <Icon name="x" size={13} color={CB_COLORS.textSecondary} />
            Limpiar
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        marginBottom: 10, padding: '8px 12px', background: '#F8FAFC',
        border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
        fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textSecondary,
      }}>
        <span style={{ fontWeight: 600, color: CB_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '.05em', fontSize: 10.5 }}>Desglose de expedientes</span>
        {[
          { icon: 'zap',            color: CB_COLORS.successDark, label: 'Aprobado autom\u00e1tico' },
          { icon: 'alert-triangle', color: CB_COLORS.warningDark, label: 'Requiere triaje' },
          { icon: 'user-check',     color: CB_COLORS.primaryDark, label: 'Aprobado manual' },
          { icon: 'user-x',         color: CB_COLORS.errorDark,   label: 'Rechazado manual' },
        ].map(it => (
          <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name={it.icon} size={12} color={it.color} />
            {it.label}
          </span>
        ))}
      </div>

      {/* Table */}
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
          <thead>
            <tr>
              <th style={thStyle}>Fecha de carga</th>
              <th style={thStyle}>Programa</th>
              <th style={thStyle}>Actividad / descripción</th>
              <th style={thStyle}>Archivos</th>
              <th style={thStyle}>Desglose de expedientes</th>
              <th style={thStyle}>Estado</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => <LoteRow key={l.id} l={l} />)}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: CB_COLORS.textMuted, fontFamily: "'Alegreya Sans', serif", fontSize: 13 }}>
            No hay lotes que coincidan con los filtros.
          </div>
        )}
      </Card>

      <div style={{
        marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted,
      }}>
        <span>Mostrando {filtered.length} de {LOTES.length} lotes</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="refresh-cw" size={11} color={CB_COLORS.textMuted} />
          Actualización automática cada 30 s
        </span>
      </div>
    </AppShell>
  );
}

Object.assign(window, { TriajeLotesScreen });
