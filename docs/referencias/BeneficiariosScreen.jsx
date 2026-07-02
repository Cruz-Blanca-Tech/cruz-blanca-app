// Cruz Blanca — Beneficiarios Screen

// Each beneficiary can be in one or more programs (EDUCA / EN FAMILIA).
// `actividad` = last activity tag (e.g. "EDUCA 2025-2").
// `perfilCompleto` = profile completeness (required fields filled).
const BENEFICIARIOS_DATA = [
  { id: 1, nombre: 'María Elena Huamán Quispe',     dni: '47823651', edad: 9,  programas: ['educa'],            actividad: 'EDUCA 2025-2',   fecha: '12/03/2026', perfilCompleto: true  },
  { id: 2, nombre: 'Carlos Andrés Condori Mamani',  dni: '51204837', edad: 12, programas: ['educa', 'familia'], actividad: 'EN FAMILIA 2026-1', fecha: '18/03/2026', perfilCompleto: true  },
  { id: 3, nombre: 'Ana Lucía Flores Ccopa',        dni: '73619482', edad: 7,  programas: ['familia'],          actividad: 'EN FAMILIA 2026-1', fecha: '02/04/2026', perfilCompleto: false },
  { id: 4, nombre: 'José Martín Quispe Tapia',      dni: '62047193', edad: 14, programas: ['educa'],            actividad: 'EDUCA 2025-2',   fecha: '05/04/2026', perfilCompleto: true  },
  { id: 5, nombre: 'Rosa Isabel Mamani Vargas',     dni: '48352019', edad: 10, programas: ['educa', 'familia'], actividad: 'EDUCA 2025-2',   fecha: '08/04/2026', perfilCompleto: true  },
  { id: 6, nombre: 'Pedro Luis Gutierrez Apaza',    dni: '57193046', edad: 8,  programas: ['educa'],            actividad: 'EDUCA 2025-1',   fecha: '10/04/2026', perfilCompleto: false },
  { id: 7, nombre: 'Lucía Fernández Cáceres',       dni: '63820174', edad: 11, programas: ['familia'],          actividad: 'EN FAMILIA 2026-1', fecha: '15/04/2026', perfilCompleto: true  },
  { id: 8, nombre: 'Diego Alonso Ramos Huanca',     dni: '44710928', edad: 13, programas: ['educa', 'familia'], actividad: 'EN FAMILIA 2026-1', fecha: '21/04/2026', perfilCompleto: true  },
];

const TOTAL_BENEFICIARIOS = 247;

const PROG_MAP = {
  educa:   { label: 'EDUCA',      color: '#C83C3E', bg: '#FDEAEA', dark: '#A62E30' },
  familia: { label: 'EN FAMILIA', color: '#625696', bg: '#EEEAF7', dark: '#4A3B78' },
};

// ── Mask helpers (Visualizador role) ──────────────────────────────────────
function maskDni(dni) {
  return dni.slice(-4); // "4523"
}
function maskNombre(nombre) {
  // "Carlos Juan Andrés Bermúdez" → "C J** A*** B***"
  return nombre.split(' ').filter(Boolean).map((w, i) => {
    if (i === 0) return w[0].toUpperCase();
    const stars = '*'.repeat(Math.min(Math.max(w.length - 1, 1), 4));
    return w[0].toUpperCase() + stars;
  }).join(' ');
}

// ── Multiselect (Programa) ────────────────────────────────────────────────
function ProgramaMultiselect({ selected, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = id => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  const label = selected.length === 0
    ? 'Todos los programas'
    : selected.length === 1
      ? PROG_MAP[selected[0]].label
      : `${selected.length} programas`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          height: 34, padding: '0 32px 0 12px', minWidth: 210,
          border: `1px solid ${open ? CB_COLORS.primary : CB_COLORS.border}`, borderRadius: 6,
          background: 'white', fontFamily: "'Alegreya Sans', serif", fontSize: 13.5,
          color: selected.length ? CB_COLORS.textPrimary : CB_COLORS.textSecondary,
          cursor: 'pointer', outline: 'none', textAlign: 'left',
          display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}>
        <Icon name="layers" size={13} color={CB_COLORS.textMuted} />
        <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
        <Icon name="chevron-down" size={12} color={CB_COLORS.textMuted} style={{ marginLeft: 'auto' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 220, zIndex: 20,
          background: 'white', border: `1px solid ${CB_COLORS.border}`, borderRadius: 8,
          boxShadow: '0 8px 24px rgba(15,23,42,0.12)', padding: 6,
        }}>
          {Object.entries(PROG_MAP).map(([id, p]) => {
            const checked = selected.includes(id);
            return (
              <label key={id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 5, cursor: 'pointer', background: checked ? p.bg : 'transparent',
                transition: 'background .12s',
              }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent'; }}>
                <input type="checkbox" checked={checked} onChange={() => toggle(id)}
                  style={{ accentColor: p.color }} />
                <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }}></span>
                <span style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textPrimary, fontWeight: checked ? 500 : 400 }}>
                  {p.label}
                </span>
              </label>
            );
          })}
          {selected.length > 0 && (
            <div style={{ borderTop: `1px solid ${CB_COLORS.border}`, marginTop: 4, paddingTop: 4 }}>
              <button onClick={() => onChange([])}
                style={{
                  width: '100%', padding: '6px 10px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted,
                }}>
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────
function Toolbar({ search, onSearch, filterProgs, onFilterProgs, filterPerfil, onFilterPerfil, fechaIni, fechaFin, onFechaIni, onFechaFin, onNuevo }) {
  const selStyle = {
    height: 34, border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
    fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, color: CB_COLORS.textPrimary,
    padding: '0 10px', background: 'white', cursor: 'pointer', outline: 'none',
    appearance: 'none', paddingRight: 28,
  };
  const chevron = {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', color: CB_COLORS.textMuted,
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200, maxWidth: 320 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="search" size={14} color={CB_COLORS.textMuted} />
        </span>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Buscar por nombre o DNI…"
          style={{
            width: '100%', height: 34, border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
            paddingLeft: 32, paddingRight: 10, fontFamily: "'Alegreya Sans', serif", fontSize: 13.5,
            color: CB_COLORS.textPrimary, outline: 'none', background: 'white',
          }}
          onFocus={e => e.target.style.borderColor = CB_COLORS.primary}
          onBlur={e => e.target.style.borderColor = CB_COLORS.border}
        />
      </div>

      {/* Programa multiselect */}
      <ProgramaMultiselect selected={filterProgs} onChange={onFilterProgs} />

      {/* Estado del perfil */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select value={filterPerfil} onChange={e => onFilterPerfil(e.target.value)} style={{ ...selStyle, minWidth: 170 }}>
          <option value="">Estado del perfil</option>
          <option value="completo">Completo</option>
          <option value="incompleto">Incompleto</option>
        </select>
        <span style={chevron}><Icon name="chevron-down" size={12} color={CB_COLORS.textMuted} /></span>
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', height: 34, border: `1px solid ${CB_COLORS.border}`, borderRadius: 6, background: 'white' }}>
        <Icon name="calendar" size={13} color={CB_COLORS.textMuted} />
        <input type="date" value={fechaIni} onChange={e => onFechaIni(e.target.value)}
          style={{ border: 'none', outline: 'none', fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textPrimary, width: 120, background: 'transparent' }} />
        <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>–</span>
        <input type="date" value={fechaFin} onChange={e => onFechaFin(e.target.value)}
          style={{ border: 'none', outline: 'none', fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textPrimary, width: 120, background: 'transparent' }} />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <Btn variant="primary" size="sm" icon="user-plus" onClick={onNuevo}>Nuevo registro</Btn>
      </div>
    </div>
  );
}

// ── Program pill ──────────────────────────────────────────────────────────
function ProgramPill({ id }) {
  const p = PROG_MAP[id];
  if (!p) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4,
      background: p.bg, color: p.dark,
      fontFamily: "'Arimo', sans-serif", fontSize: 10.5, fontWeight: 500,
      letterSpacing: '.02em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }}></span>
      {p.label}
    </span>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────
function BeneficiariosTable({ rows, masked }) {
  const thS = {
    fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500,
    color: CB_COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '.05em',
    padding: '0 14px 10px', textAlign: 'left', borderBottom: `1px solid ${CB_COLORS.border}`,
    whiteSpace: 'nowrap',
  };
  const tdS = {
    fontFamily: "'Arimo', sans-serif", fontSize: 13, color: CB_COLORS.textPrimary,
    padding: '11px 14px', borderBottom: `1px solid ${CB_COLORS.border}`, verticalAlign: 'middle',
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thS}>Nombre completo</th>
            <th style={thS}>DNI</th>
            <th style={{ ...thS, textAlign: 'center', width: 60 }}>Edad</th>
            <th style={thS}>Programas</th>
            <th style={thS}>Última actividad</th>
            <th style={thS}>Último registro</th>
            <th style={thS}>Estado del perfil</th>
            <th style={{ ...thS, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            // Avatar color follows the FIRST program assigned
            const primaryProg = PROG_MAP[row.programas[0]];
            return (
              <tr key={row.id}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ transition: 'background .1s', cursor: 'default' }}>

                {/* Nombre */}
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: primaryProg.bg, color: primaryProg.dark,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500,
                    }}>
                      {masked ? '?' : row.nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <span style={{ fontWeight: 500, color: masked ? CB_COLORS.textMuted : CB_COLORS.textPrimary, fontStyle: masked ? 'italic' : 'normal' }}>
                      {masked ? maskNombre(row.nombre) : row.nombre}
                    </span>
                  </div>
                </td>

                {/* DNI */}
                <td style={{ ...tdS, fontFamily: "'Arimo', sans-serif", color: masked ? CB_COLORS.textMuted : CB_COLORS.textSecondary, letterSpacing: masked ? '.04em' : 0 }}>
                  {masked
                    ? <span>•••• <span style={{ color: CB_COLORS.textSecondary, fontWeight: 500 }}>{maskDni(row.dni)}</span></span>
                    : row.dni}
                </td>

                {/* Edad */}
                <td style={{ ...tdS, textAlign: 'center', color: CB_COLORS.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                  {row.edad}
                </td>

                {/* Programas — multiple badges */}
                <td style={tdS}>
                  <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                    {row.programas.map(p => <ProgramPill key={p} id={p} />)}
                  </div>
                </td>

                {/* Última actividad */}
                <td style={tdS}>
                  <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textSecondary, fontWeight: 500 }}>
                    {row.actividad}
                  </span>
                </td>

                {/* Último registro */}
                <td style={{ ...tdS, color: CB_COLORS.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                  {row.fecha}
                </td>

                {/* Estado del perfil */}
                <td style={tdS}>
                  <Badge type={row.perfilCompleto ? 'success' : 'warning'} dot>
                    {row.perfilCompleto ? 'Completo' : 'Incompleto'}
                  </Badge>
                </td>

                {/* Acciones */}
                <td style={{ ...tdS, textAlign: 'right' }}>
                  <button
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                      border: `1px solid ${CB_COLORS.border}`, borderRadius: 6, background: 'white',
                      color: CB_COLORS.primary, fontFamily: "'Alegreya Sans', serif", fontSize: 12.5, fontWeight: 500,
                      cursor: 'pointer', transition: 'all .12s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = CB_COLORS.primary; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = CB_COLORS.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = CB_COLORS.primary; e.currentTarget.style.borderColor = CB_COLORS.border; }}>
                    <Icon name="eye" size={12} color="currentColor" />
                    Ver perfil
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, totalLabel, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const btnStyle = (active) => ({
    minWidth: 30, height: 30, padding: '0 8px',
    border: `1px solid ${active ? CB_COLORS.primary : CB_COLORS.border}`,
    borderRadius: 6, background: active ? CB_COLORS.primary : 'white',
    color: active ? 'white' : CB_COLORS.textSecondary,
    fontFamily: "'Arimo', sans-serif", fontSize: 12, fontWeight: active ? 500 : 400,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .12s',
  });

  // Show first 5 pages + ellipsis + last for the 247-record demo
  const visiblePages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
  } else {
    visiblePages.push(1, 2, 3, 4, 5, '…', totalPages);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: `1px solid ${CB_COLORS.border}` }}>
      <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>
        Mostrando <strong style={{ color: CB_COLORS.textSecondary, fontWeight: 500 }}>{start}–{end}</strong> de <strong style={{ color: CB_COLORS.textSecondary, fontWeight: 500 }}>{totalLabel}</strong> beneficiarios
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button style={{ ...btnStyle(false), opacity: page === 1 ? .4 : 1 }} onClick={() => page > 1 && onChange(page - 1)} disabled={page === 1}>
          <Icon name="chevron-left" size={13} color={CB_COLORS.textSecondary} />
        </button>
        {visiblePages.map((p, i) => p === '…'
          ? <span key={`e${i}`} style={{ padding: '0 4px', color: CB_COLORS.textMuted, fontFamily: "'Arimo', sans-serif", fontSize: 12 }}>…</span>
          : <button key={p} style={btnStyle(p === page)} onClick={() => onChange(p)}>{p}</button>
        )}
        <button style={{ ...btnStyle(false), opacity: page === totalPages ? .4 : 1 }} onClick={() => page < totalPages && onChange(page + 1)} disabled={page === totalPages}>
          <Icon name="chevron-right" size={13} color={CB_COLORS.textSecondary} />
        </button>
      </div>
    </div>
  );
}

// ── Role toggle pill ──────────────────────────────────────────────────────
function RolePill({ masked, onToggle }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 8px',
      borderRadius: 20, background: masked ? '#EEEAF7' : CB_COLORS.infoLight,
      border: `1px solid ${masked ? '#625696' : CB_COLORS.info}33`,
      cursor: 'pointer', transition: 'all .15s', userSelect: 'none',
    }}
      onClick={onToggle}>
      <Icon name={masked ? 'eye-off' : 'eye'} size={13} color={masked ? '#625696' : CB_COLORS.infoDark} />
      <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500, color: masked ? '#625696' : CB_COLORS.infoDark }}>
        Vista: {masked ? 'Visualizador' : 'Operativo'}
      </span>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
function BeneficiariosScreen() {
  const [active, setActive]             = React.useState('beneficiarios');
  const [search, setSearch]             = React.useState('');
  const [filterProgs, setFilterProgs]   = React.useState([]);     // multiselect
  const [filterPerfil, setFilterPerfil] = React.useState('');     // '' | 'completo' | 'incompleto'
  const [fechaIni, setFechaIni]         = React.useState('2026-01-01');
  const [fechaFin, setFechaFin]         = React.useState('2026-04-30');
  const [page, setPage]                 = React.useState(1);
  const [masked, setMasked]             = React.useState(false);
  const PER_PAGE = 8;

  const filtered = BENEFICIARIOS_DATA.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.nombre.toLowerCase().includes(q) || r.dni.includes(q);
    const matchProgs  = filterProgs.length === 0 || r.programas.some(p => filterProgs.includes(p));
    const matchPerfil = !filterPerfil
      || (filterPerfil === 'completo'   && r.perfilCompleto)
      || (filterPerfil === 'incompleto' && !r.perfilCompleto);
    return matchSearch && matchProgs && matchPerfil;
  });

  React.useEffect(() => setPage(1), [search, filterProgs, filterPerfil]);

  // Summary chips — based on the full dataset (mocked totals)
  const totalCompletos    = Math.round(TOTAL_BENEFICIARIOS * 0.86);
  const totalIncompletos  = TOTAL_BENEFICIARIOS - totalCompletos;

  const currentUser = masked
    ? { name: 'Luis Castillo',   role: 'Visualizador' }
    : { name: 'Carmen Huamán',   role: 'Operativo' };

  return (
    <AppShell
      active={active}
      onNavigate={setActive}
      title="Beneficiarios"
      subtitle="Gestión y consulta de registros"
      user={currentUser}
    >
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 26, fontWeight: 700, color: CB_COLORS.textPrimary }}>Beneficiarios</div>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textMuted, marginTop: 2 }}>
            {TOTAL_BENEFICIARIOS} niñas y niños registrados en EDUCA y EN FAMILIA
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: CB_COLORS.successLight, color: CB_COLORS.successDark, fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500 }}>
              <Icon name="check-circle" size={11} color={CB_COLORS.successDark} />
              {totalCompletos} perfiles completos
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: CB_COLORS.warningLight, color: CB_COLORS.warningDark, fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500 }}>
              <Icon name="alert-triangle" size={11} color={CB_COLORS.warningDark} />
              {totalIncompletos} incompletos
            </span>
          </div>
          <RolePill masked={masked} onToggle={() => setMasked(m => !m)} />
        </div>
      </div>

      {/* Mask banner */}
      {masked && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
          background: '#EEEAF7', border: '1px solid #625696' + '33', borderRadius: 8,
          marginBottom: 14,
        }}>
          <Icon name="eye-off" size={14} color="#4A3B78" style={{ marginTop: 2 }} />
          <div>
            <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: '#4A3B78' }}>
              Vista del Visualizador
            </div>
            <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textSecondary, marginTop: 1 }}>
              El nombre se muestra abreviado y el DNI sólo expone los últimos cuatro dígitos por protección de datos personales.
            </div>
          </div>
        </div>
      )}

      {/* Table card */}
      <Card padding={0} style={{ overflow: 'visible' }}>
        <div style={{ padding: 16, paddingBottom: 0 }}>
          <Toolbar
            search={search} onSearch={setSearch}
            filterProgs={filterProgs} onFilterProgs={setFilterProgs}
            filterPerfil={filterPerfil} onFilterPerfil={setFilterPerfil}
            fechaIni={fechaIni} fechaFin={fechaFin}
            onFechaIni={setFechaIni} onFechaFin={setFechaFin}
            onNuevo={() => { window.location.href = 'RegistroManual.html'; }}
          />
        </div>
        {filtered.length > 0
          ? <BeneficiariosTable rows={filtered.slice(0, PER_PAGE)} masked={masked} />
          : (
            <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: "'Alegreya Sans', serif", fontSize: 15, color: CB_COLORS.textMuted }}>
              <Icon name="search" size={32} color={CB_COLORS.border} style={{ display: 'block', margin: '0 auto 12px' }} />
              No hay registros para mostrar
            </div>
          )
        }
        <Pagination
          page={page}
          total={TOTAL_BENEFICIARIOS}
          perPage={PER_PAGE}
          totalLabel={TOTAL_BENEFICIARIOS}
          onChange={setPage}
        />
      </Card>
    </AppShell>
  );
}

Object.assign(window, { BeneficiariosScreen });
