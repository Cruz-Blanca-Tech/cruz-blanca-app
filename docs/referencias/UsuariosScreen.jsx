// Cruz Blanca — Gestión de Usuarios

const ROLES_CFG = {
  admin:        { label: 'Admin',        badge: 'primary' },
  operativo:    { label: 'Operativo',    badge: 'warning' },
  visualizador: { label: 'Visualizador', badge: 'gray' },
};

const USUARIOS_DATA = [
  {
    id: 1, nombre: 'Carmen Rosa Huamán Quispe',     email: 'carmen.huaman@cruzblanca.org.pe',
    rol: 'admin',        estado: 'activo',   ultimo: 'Hoy, 09:42',
    programas: ['educa', 'familia', 'accion', 'campamentos', 'missions'],
  },
  {
    id: 2, nombre: 'José Antonio Mendoza Salazar',  email: 'jose.mendoza@cruzblanca.org.pe',
    rol: 'operativo',    estado: 'activo',   ultimo: 'Hoy, 08:15',
    programas: ['educa', 'familia'],
  },
  {
    id: 3, nombre: 'María Elena Vargas Ramírez',     email: 'maria.vargas@cruzblanca.org.pe',
    rol: 'operativo',    estado: 'activo',   ultimo: 'Ayer, 17:28',
    programas: ['accion', 'campamentos'],
  },
  {
    id: 4, nombre: 'Luis Fernando Castillo Paredes', email: 'luis.castillo@cruzblanca.org.pe',
    rol: 'visualizador', estado: 'activo',   ultimo: '24 abr, 14:03',
    programas: ['educa', 'familia', 'accion'],
  },
  {
    id: 5, nombre: 'Rosa Patricia Flores Cárdenas',  email: 'rosa.flores@cruzblanca.org.pe',
    rol: 'visualizador', estado: 'inactivo', ultimo: '11 mar, 10:51',
    programas: ['missions'],
  },
  {
    id: 6, nombre: 'Diego Alejandro Torres Aguilar', email: 'diego.torres@cruzblanca.org.pe',
    rol: 'operativo',    estado: 'activo',   ultimo: '26 abr, 16:47',
    programas: ['educa', 'campamentos', 'missions'],
  },
];

// ── Role-view toggle (Admin / Operativo) ───────────────────────────────────
function RoleViewToggle({ role, onChange }) {
  const opts = [
    { id: 'admin',     label: 'Administrador', icon: 'shield' },
    { id: 'operativo', label: 'Operativo',     icon: 'user' },
  ];
  return (
    <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
      {opts.map(o => {
        const active = role === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              background: active ? 'white' : 'transparent',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              fontFamily: "'Arimo', sans-serif", fontSize: 12, fontWeight: 500,
              color: active ? CB_COLORS.primary : CB_COLORS.textMuted,
              transition: 'all .12s',
            }}>
            <Icon name={o.icon} size={12} color="currentColor" />
            Vista: {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Avatar with palette by role ────────────────────────────────────────────
function UserAvatar({ name, rol, size = 34 }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const palette = {
    admin:        { bg: '#E6EEF8', fg: CB_COLORS.primaryDark },
    operativo:    { bg: CB_COLORS.warningLight, fg: CB_COLORS.warningDark },
    visualizador: { bg: '#F1F5F9', fg: CB_COLORS.textSecondary },
  }[rol] || { bg: '#F1F5F9', fg: CB_COLORS.textSecondary };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: palette.bg, color: palette.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontFamily: "'Arimo', sans-serif", fontSize: size * 0.34, fontWeight: 500,
    }}>{initials}</div>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────
function UsuariosTable({ rows, onEdit }) {
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
            <th style={{ ...thS, width: 56 }}></th>
            <th style={thS}>Nombre</th>
            <th style={thS}>Email</th>
            <th style={thS}>Rol</th>
            <th style={thS}>Estado</th>
            <th style={thS}>Último acceso</th>
            <th style={{ ...thS, textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => {
            const rolCfg = ROLES_CFG[u.rol];
            const isInactivo = u.estado === 'inactivo';
            return (
              <tr key={u.id}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ transition: 'background .1s', opacity: isInactivo ? 0.7 : 1 }}>
                <td style={{ ...tdS, paddingRight: 0 }}>
                  <UserAvatar name={u.nombre} rol={u.rol} size={34} />
                </td>
                <td style={tdS}>
                  <span style={{ fontWeight: 500 }}>{u.nombre}</span>
                </td>
                <td style={{ ...tdS, color: CB_COLORS.textSecondary }}>{u.email}</td>
                <td style={tdS}>
                  <Badge type={rolCfg.badge}>{rolCfg.label}</Badge>
                </td>
                <td style={tdS}>
                  <Badge type={isInactivo ? 'gray' : 'success'} dot>
                    {isInactivo ? 'Inactivo' : 'Activo'}
                  </Badge>
                </td>
                <td style={{ ...tdS, color: CB_COLORS.textMuted, fontSize: 12 }}>{u.ultimo}</td>
                <td style={{ ...tdS, textAlign: 'right' }}>
                  <button onClick={() => onEdit(u)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                      border: `1px solid ${CB_COLORS.border}`, borderRadius: 6, background: 'white',
                      color: CB_COLORS.textSecondary, fontFamily: "'Arimo', sans-serif", fontSize: 12,
                      cursor: 'pointer', transition: 'all .12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = CB_COLORS.primary; e.currentTarget.style.color = CB_COLORS.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = CB_COLORS.border; e.currentTarget.style.color = CB_COLORS.textSecondary; }}>
                    <Icon name="pencil" size={12} color="currentColor" />
                    Editar
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

// ── Modal shell ────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer, width = 520 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 10, width, maxWidth: '92vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${CB_COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 19, fontWeight: 700, color: CB_COLORS.textPrimary, letterSpacing: '-0.01em' }}>{title}</div>
            {subtitle && <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textMuted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, borderRadius: 4,
            color: CB_COLORS.textMuted, display: 'inline-flex',
          }}>
            <Icon name="x" size={18} color="currentColor" />
          </button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '14px 22px', borderTop: `1px solid ${CB_COLORS.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#F8FAFC' }}>{footer}</div>}
      </div>
    </div>
  );
}

// ── Field primitives ───────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500, color: CB_COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
      {children}{required && <span style={{ color: CB_COLORS.error, marginLeft: 3 }}>*</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{
        width: '100%', height: 38, border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
        padding: '0 12px', fontFamily: "'Alegreya Sans', serif", fontSize: 14,
        color: CB_COLORS.textPrimary, background: disabled ? '#F1F5F9' : 'white', outline: 'none',
      }}
      onFocus={e => e.target.style.borderColor = CB_COLORS.primary}
      onBlur={e => e.target.style.borderColor = CB_COLORS.border} />
  );
}

function RoleRadio({ value, onChange, disabled }) {
  const opts = [
    { id: 'admin',        label: 'Admin',        desc: 'Acceso total al sistema' },
    { id: 'operativo',    label: 'Operativo',    desc: 'Carga, edita y revisa registros' },
    { id: 'visualizador', label: 'Visualizador', desc: 'Solo consulta de reportes' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {opts.map(o => {
        const active = value === o.id;
        return (
          <label key={o.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px', border: `1px solid ${active ? CB_COLORS.primary : CB_COLORS.border}`,
              borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
              background: active ? '#F4F8FC' : 'white',
              opacity: disabled ? 0.55 : 1, transition: 'all .12s',
            }}>
            <input type="radio" checked={active} disabled={disabled}
              onChange={() => !disabled && onChange(o.id)}
              style={{ marginTop: 3, accentColor: CB_COLORS.primary }} />
            <div>
              <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500, color: CB_COLORS.textPrimary }}>{o.label}</div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, marginTop: 1 }}>{o.desc}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function ProgramaChecks({ selected, onToggle, disabled }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {PROGRAMS.map(p => {
        const checked = selected.includes(p.id);
        return (
          <label key={p.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              border: `1px solid ${checked ? p.color : CB_COLORS.border}`,
              borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
              background: checked ? p.light : 'white',
              opacity: disabled ? 0.55 : 1, transition: 'all .12s',
            }}>
            <input type="checkbox" checked={checked} disabled={disabled}
              onChange={() => !disabled && onToggle(p.id)}
              style={{ accentColor: p.color }} />
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }}></span>
            <span style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textPrimary }}>
              {p.label.replace('Cruz Blanca ', '')}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ── Invite modal ───────────────────────────────────────────────────────────
function InviteModal({ onClose }) {
  const [email, setEmail] = React.useState('');
  const [rol, setRol] = React.useState('operativo');
  const [progs, setProgs] = React.useState(['educa', 'familia']);

  const toggle = id => setProgs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <Modal title="Invitar usuario" subtitle="Envía una invitación por correo para unirse al sistema" onClose={onClose}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="send" onClick={onClose}>Invitar</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <FieldLabel required>Correo electrónico</FieldLabel>
          <TextInput value={email} onChange={setEmail} placeholder="nombre.apellido@cruzblanca.org.pe" />
          <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, marginTop: 5 }}>
            Recomendado: usar dominio @cruzblanca.org.pe
          </div>
        </div>

        <div>
          <FieldLabel required>Rol</FieldLabel>
          <RoleRadio value={rol} onChange={setRol} />
        </div>

        <div>
          <FieldLabel>Programas asignados</FieldLabel>
          <ProgramaChecks selected={progs} onToggle={toggle} disabled={rol === 'admin'} />
          {rol === 'admin' && (
            <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, marginTop: 5 }}>
              Los administradores acceden a todos los programas automáticamente.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────────────
function EditModal({ user, onClose, canChangeRole }) {
  const [rol, setRol]       = React.useState(user.rol);
  const [estado, setEstado] = React.useState(user.estado);
  const [progs, setProgs]   = React.useState(user.programas);
  const toggle = id => setProgs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <Modal title="Editar usuario" subtitle={user.nombre} onClose={onClose}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={onClose}>Guardar cambios</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: `1px solid ${CB_COLORS.border}` }}>
          <UserAvatar name={user.nombre} rol={user.rol} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500, color: CB_COLORS.textPrimary }}>{user.nombre}</div>
            <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>{user.email}</div>
          </div>
        </div>

        <div>
          <FieldLabel>Rol</FieldLabel>
          <RoleRadio value={rol} onChange={setRol} disabled={!canChangeRole} />
          {!canChangeRole && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, marginTop: 6 }}>
              <Icon name="lock" size={11} color={CB_COLORS.textMuted} />
              Solo un administrador puede cambiar el rol de un usuario.
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Programas asignados</FieldLabel>
          <ProgramaChecks selected={progs} onToggle={toggle} disabled={rol === 'admin'} />
        </div>

        <div style={{ paddingTop: 14, borderTop: `1px solid ${CB_COLORS.border}` }}>
          <FieldLabel>Estado de la cuenta</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, background: estado === 'inactivo' ? '#F1F5F9' : CB_COLORS.successLight, border: `1px solid ${estado === 'inactivo' ? CB_COLORS.border : CB_COLORS.success}33` }}>
            <label style={{ position: 'relative', display: 'inline-block', width: 38, height: 22, cursor: 'pointer', flexShrink: 0 }}>
              <input type="checkbox" checked={estado === 'activo'} onChange={e => setEstado(e.target.checked ? 'activo' : 'inactivo')}
                style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: 22, transition: '.2s',
                background: estado === 'activo' ? CB_COLORS.success : '#CBD5E1',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: estado === 'activo' ? 19 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: 'white', transition: '.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}></span>
              </span>
            </label>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textPrimary }}>
                {estado === 'activo' ? 'Cuenta activa' : 'Cuenta desactivada'}
              </div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textMuted, marginTop: 1 }}>
                {estado === 'activo'
                  ? 'El usuario puede iniciar sesión y acceder al sistema.'
                  : 'El usuario no podrá iniciar sesión. Los registros quedan intactos.'}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="info" size={11} color={CB_COLORS.textMuted} />
            Los usuarios se desactivan, no se eliminan, para preservar la trazabilidad.
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Activity log data ──────────────────────────────────────────────────────
const ACTION_TYPES = {
  carga_ocr:    { label: 'Carga OCR',            badge: 'purple',  icon: 'scan-line' },
  correccion:   { label: 'Corrección triaje',    badge: 'warning', icon: 'edit-3' },
  registro:     { label: 'Nuevo registro manual', badge: 'info',    icon: 'user-plus' },
  carga_masiva: { label: 'Carga masiva',          badge: 'info',    icon: 'upload-cloud' },
  edicion:      { label: 'Edición de perfil',     badge: 'gray',    icon: 'pencil' },
  aprobacion:   { label: 'Aprobación de lote',    badge: 'success', icon: 'check-circle' },
};

const PROGRAMA_BADGE = {
  educa:   { label: 'EDUCA',      color: '#C83C3E', bg: '#FDEAEA', dark: '#A62E30' },
  familia: { label: 'EN FAMILIA', color: '#625696', bg: '#EEEAF7', dark: '#4A3B78' },
};

const ACTIVIDAD_DATA = [
  { id: 1,  fecha: '26/05/2026 14:32', usuario: 'Carmen Rosa Huamán Quispe',     accion: 'aprobacion',   programa: 'educa',   actividad: 'EDUCA 2026-1',      registros: 48  },
  { id: 2,  fecha: '26/05/2026 11:15', usuario: 'José Antonio Mendoza Salazar',  accion: 'carga_ocr',    programa: 'educa',   actividad: 'EDUCA 2026-1',      registros: 12  },
  { id: 3,  fecha: '26/05/2026 09:48', usuario: 'María Elena Vargas Ramírez',     accion: 'correccion',   programa: 'familia', actividad: 'EN FAMILIA 2026-1', registros: 6   },
  { id: 4,  fecha: '25/05/2026 17:22', usuario: 'Diego Alejandro Torres Aguilar', accion: 'registro',     programa: 'educa',   actividad: 'EDUCA 2026-1',      registros: 1   },
  { id: 5,  fecha: '25/05/2026 15:04', usuario: 'José Antonio Mendoza Salazar',  accion: 'carga_masiva', programa: 'familia', actividad: 'EN FAMILIA 2025-2', registros: 132 },
  { id: 6,  fecha: '25/05/2026 10:41', usuario: 'Carmen Rosa Huamán Quispe',     accion: 'edicion',      programa: 'educa',   actividad: 'EDUCA 2025-2',      registros: 1   },
  { id: 7,  fecha: '24/05/2026 16:58', usuario: 'María Elena Vargas Ramírez',     accion: 'carga_ocr',    programa: 'familia', actividad: 'EN FAMILIA 2026-1', registros: 24  },
  { id: 8,  fecha: '24/05/2026 14:13', usuario: 'Diego Alejandro Torres Aguilar', accion: 'correccion',   programa: 'educa',   actividad: 'EDUCA 2025-2',      registros: 8   },
  { id: 9,  fecha: '24/05/2026 09:27', usuario: 'Carmen Rosa Huamán Quispe',     accion: 'aprobacion',   programa: 'familia', actividad: 'EN FAMILIA 2026-1', registros: 32  },
  { id: 10, fecha: '23/05/2026 18:05', usuario: 'José Antonio Mendoza Salazar',  accion: 'registro',     programa: 'educa',   actividad: 'EDUCA 2026-1',      registros: 1   },
];

const ACTIVIDAD_TOTAL = 156;

// ── Tabs nav ──────────────────────────────────────────────────────────────
function TabsNav({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, borderBottom: `1px solid ${CB_COLORS.border}`,
      marginBottom: 18,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${isActive ? CB_COLORS.primary : 'transparent'}`,
              fontFamily: "'Alegreya Sans', serif", fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? CB_COLORS.primary : CB_COLORS.textSecondary,
              cursor: 'pointer', marginBottom: -1,
              transition: 'all .12s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = CB_COLORS.textPrimary; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = CB_COLORS.textSecondary; }}>
            {t.icon && <Icon name={t.icon} size={14} color="currentColor" />}
            {t.label}
            {t.count !== undefined && (
              <span style={{
                fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500,
                padding: '1px 7px', borderRadius: 10,
                background: isActive ? CB_COLORS.primary + '18' : '#F1F5F9',
                color: isActive ? CB_COLORS.primary : CB_COLORS.textMuted,
              }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Action badge ──────────────────────────────────────────────────────────
function ActionBadge({ type }) {
  const cfg = ACTION_TYPES[type];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Badge type={cfg.badge}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name={cfg.icon} size={10} color="currentColor" />
          {cfg.label}
        </span>
      </Badge>
    </span>
  );
}

// ── Programa badge ────────────────────────────────────────────────────────
function ProgramaBadge({ id }) {
  const p = PROGRAMA_BADGE[id];
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

// ── Actividad table ───────────────────────────────────────────────────────
function ActividadTable({ rows }) {
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
            <th style={thS}>Fecha y hora</th>
            <th style={thS}>Usuario</th>
            <th style={thS}>Acción</th>
            <th style={thS}>Programa</th>
            <th style={thS}>Actividad</th>
            <th style={{ ...thS, textAlign: 'right' }}>Registros afectados</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const userRecord = USUARIOS_DATA.find(u => u.nombre === r.usuario);
            const userRol = userRecord ? userRecord.rol : 'visualizador';
            return (
              <tr key={r.id}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ transition: 'background .1s' }}>
                <td style={{ ...tdS, fontVariantNumeric: 'tabular-nums', color: CB_COLORS.textSecondary, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                  {r.fecha}
                </td>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar name={r.usuario} rol={userRol} size={28} />
                    <span style={{ fontWeight: 500 }}>{r.usuario}</span>
                  </div>
                </td>
                <td style={tdS}><ActionBadge type={r.accion} /></td>
                <td style={tdS}><ProgramaBadge id={r.programa} /></td>
                <td style={{ ...tdS, color: CB_COLORS.textSecondary, fontSize: 12, fontWeight: 500 }}>
                  {r.actividad}
                </td>
                <td style={{ ...tdS, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {r.registros.toLocaleString('es-PE')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Actividad pagination ──────────────────────────────────────────────────
function ActividadPagination({ page, total, perPage, onChange }) {
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

  const visiblePages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
  } else {
    visiblePages.push(1, 2, 3, 4, 5, '…', totalPages);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: `1px solid ${CB_COLORS.border}` }}>
      <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>
        Mostrando <strong style={{ color: CB_COLORS.textSecondary, fontWeight: 500 }}>{start}–{end}</strong> de <strong style={{ color: CB_COLORS.textSecondary, fontWeight: 500 }}>{total.toLocaleString('es-PE')}</strong> registros
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

// ── Actividad tab ─────────────────────────────────────────────────────────
function ActividadTab() {
  const [page, setPage]               = React.useState(1);
  const [fechaIni, setFechaIni]       = React.useState('2026-05-01');
  const [fechaFin, setFechaFin]       = React.useState('2026-05-31');
  const [filterUsuario, setFilterUsuario] = React.useState('');
  const [filterAccion, setFilterAccion]   = React.useState('');
  const [filterPrograma, setFilterPrograma] = React.useState('');

  const filtered = ACTIVIDAD_DATA.filter(r => {
    const matchUsuario  = !filterUsuario  || r.usuario  === filterUsuario;
    const matchAccion   = !filterAccion   || r.accion   === filterAccion;
    const matchPrograma = !filterPrograma || r.programa === filterPrograma;
    return matchUsuario && matchAccion && matchPrograma;
  });

  const selStyle = {
    height: 34, border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
    fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, color: CB_COLORS.textPrimary,
    padding: '0 28px 0 10px', background: 'white', cursor: 'pointer', outline: 'none',
    appearance: 'none',
  };
  const chevron = {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', color: CB_COLORS.textMuted,
  };

  return (
    <Card padding={0}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderBottom: `1px solid ${CB_COLORS.border}`, flexWrap: 'wrap' }}>
        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', height: 34, border: `1px solid ${CB_COLORS.border}`, borderRadius: 6, background: 'white' }}>
          <Icon name="calendar" size={13} color={CB_COLORS.textMuted} />
          <input type="date" value={fechaIni} onChange={e => setFechaIni(e.target.value)}
            style={{ border: 'none', outline: 'none', fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textPrimary, width: 120, background: 'transparent' }} />
          <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>–</span>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            style={{ border: 'none', outline: 'none', fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textPrimary, width: 120, background: 'transparent' }} />
        </div>

        {/* Usuario */}
        <div style={{ position: 'relative' }}>
          <select value={filterUsuario} onChange={e => setFilterUsuario(e.target.value)} style={{ ...selStyle, minWidth: 200 }}>
            <option value="">Todos los usuarios</option>
            {USUARIOS_DATA.map(u => (
              <option key={u.id} value={u.nombre}>{u.nombre}</option>
            ))}
          </select>
          <span style={chevron}><Icon name="chevron-down" size={12} color={CB_COLORS.textMuted} /></span>
        </div>

        {/* Acción */}
        <div style={{ position: 'relative' }}>
          <select value={filterAccion} onChange={e => setFilterAccion(e.target.value)} style={{ ...selStyle, minWidth: 180 }}>
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_TYPES).map(([id, cfg]) => (
              <option key={id} value={id}>{cfg.label}</option>
            ))}
          </select>
          <span style={chevron}><Icon name="chevron-down" size={12} color={CB_COLORS.textMuted} /></span>
        </div>

        {/* Programa */}
        <div style={{ position: 'relative' }}>
          <select value={filterPrograma} onChange={e => setFilterPrograma(e.target.value)} style={{ ...selStyle, minWidth: 160 }}>
            <option value="">Todos los programas</option>
            <option value="educa">EDUCA</option>
            <option value="familia">EN FAMILIA</option>
          </select>
          <span style={chevron}><Icon name="chevron-down" size={12} color={CB_COLORS.textMuted} /></span>
        </div>

        {/* Right actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>
            {filtered.length} de {ACTIVIDAD_TOTAL.toLocaleString('es-PE')} eventos
          </span>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            border: `1px solid ${CB_COLORS.border}`, borderRadius: 6, background: 'white',
            color: CB_COLORS.textSecondary, fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}>
            <Icon name="download" size={12} color="currentColor" />
            Exportar
          </button>
        </div>
      </div>

      <ActividadTable rows={filtered} />
      <ActividadPagination page={page} total={ACTIVIDAD_TOTAL} perPage={10} onChange={setPage} />
    </Card>
  );
}

// ── Operativo restriction banner ───────────────────────────────────────────
function OperativoBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
      background: CB_COLORS.warningLight, border: `1px solid ${CB_COLORS.warning}33`, borderRadius: 8,
      marginBottom: 16,
    }}>
      <Icon name="info" size={14} color={CB_COLORS.warningDark} style={{ marginTop: 2 }} />
      <div>
        <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.warningDark }}>
          Vista con permisos de Operativo
        </div>
        <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textSecondary, marginTop: 1 }}>
          Puedes consultar la lista de usuarios y editar datos básicos. Las acciones de invitar y cambiar roles están reservadas para Administradores.
        </div>
      </div>
    </div>
  );
}

// ── Access denied screen (Operativo / Visualizador) ─────────────────────────
function AccessDenied({ role }) {
  return (
    <div style={{
      maxWidth: 520, margin: '60px auto', textAlign: 'center',
      background: 'white', border: `1px solid ${CB_COLORS.border}`, borderRadius: 12,
      padding: '40px 32px', boxShadow: '0 4px 16px rgba(12,82,155,0.06)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px',
        background: CB_COLORS.warningLight, color: CB_COLORS.warningDark,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="shield-off" size={28} color="currentColor" />
      </div>
      <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 22, fontWeight: 700, color: CB_COLORS.textPrimary, letterSpacing: '-0.01em', marginBottom: 8 }}>
        Acceso restringido
      </div>
      <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textSecondary, lineHeight: 1.45, marginBottom: 18 }}>
        La gestión de usuarios es exclusiva del rol <strong style={{ color: CB_COLORS.textPrimary }}>Administrador</strong>.
        Tu rol actual ({role}) no tiene permisos para visualizar esta sección.
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        background: '#F8FAFC', border: `1px solid ${CB_COLORS.border}`, borderRadius: 8,
        fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted,
      }}>
        <Icon name="info" size={12} color={CB_COLORS.textMuted} />
        Si necesitas administrar cuentas, solicita el acceso a un administrador del sistema.
      </div>
      <div style={{ marginTop: 22 }}>
        <a href="DashboardHome.html" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
          background: CB_COLORS.primary, color: 'white', borderRadius: 6,
          fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500, textDecoration: 'none',
        }}>
          <Icon name="arrow-left" size={14} color="currentColor" />
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
function UsuariosScreen() {
  const [active, setActive]       = React.useState('usuarios');
  const [roleView, setRoleView]   = React.useState('admin');
  const [tab, setTab]             = React.useState('usuarios');
  const [search, setSearch]       = React.useState('');
  const [filterRol, setFilterRol] = React.useState('');
  const [showInvite, setShowInvite] = React.useState(false);
  const [editing, setEditing]       = React.useState(null);

  const isAdmin = roleView === 'admin';
  const currentUser = isAdmin
    ? { name: 'Carmen Huamán', role: 'Administrador' }
    : { name: 'José Mendoza',  role: 'Operativo' };

  // Operativo cannot see this screen at all
  React.useEffect(() => { if (!isAdmin && tab === 'actividad') setTab('usuarios'); }, [isAdmin, tab]);

  const filtered = USUARIOS_DATA.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRol    = !filterRol || u.rol === filterRol;
    return matchSearch && matchRol;
  });

  const totalActivos     = USUARIOS_DATA.filter(u => u.estado === 'activo').length;
  const totalAdmins      = USUARIOS_DATA.filter(u => u.rol === 'admin').length;
  const totalOperativos  = USUARIOS_DATA.filter(u => u.rol === 'operativo').length;

  const handleInviteClick = () => { if (isAdmin) setShowInvite(true); };

  // Tabs definition
  const tabs = isAdmin
    ? [
        { id: 'usuarios',  label: 'Usuarios',              icon: 'users',  count: USUARIOS_DATA.length },
        { id: 'actividad', label: 'Registro de actividad', icon: 'history', count: ACTIVIDAD_TOTAL },
      ]
    : [
        { id: 'usuarios',  label: 'Usuarios',              icon: 'users',  count: USUARIOS_DATA.length },
      ];

  return (
    <AppShell
      active={active}
      onNavigate={setActive}
      title="Usuarios"
      subtitle="Gestión de cuentas y permisos del sistema"
      user={currentUser}
    >
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 26, fontWeight: 700, color: CB_COLORS.textPrimary }}>
            {!isAdmin ? 'Gestión de Usuarios' : (tab === 'actividad' ? 'Registro de actividad' : 'Gestión de Usuarios')}
          </div>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textMuted, marginTop: 2 }}>
            {!isAdmin
              ? 'Sección exclusiva para administradores del sistema'
              : (tab === 'actividad'
                ? `${ACTIVIDAD_TOTAL.toLocaleString('es-PE')} acciones registradas · trazabilidad completa del sistema`
                : `${USUARIOS_DATA.length} usuarios en total · ${totalActivos} activos · ${totalAdmins} administradores · ${totalOperativos} operativos`)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RoleViewToggle role={roleView} onChange={setRoleView} />
          {isAdmin && tab === 'usuarios' && (
            <button onClick={handleInviteClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                background: CB_COLORS.primary,
                color: 'white', border: 'none', borderRadius: 6,
                fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}>
              <Icon name="user-plus" size={14} color="currentColor" />
              Invitar usuario
            </button>
          )}
        </div>
      </div>

      {/* Access denied for non-admins */}
      {!isAdmin && <AccessDenied role="Operativo" />}

      {/* Admin-only content */}
      {isAdmin && <TabsNav tabs={tabs} active={tab} onChange={setTab} />}

      {isAdmin && tab === 'usuarios' && (
        <Card padding={0}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderBottom: `1px solid ${CB_COLORS.border}` }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="search" size={14} color={CB_COLORS.textMuted} />
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email…"
                style={{
                  width: '100%', height: 34, border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
                  paddingLeft: 32, paddingRight: 10, fontFamily: "'Alegreya Sans', serif", fontSize: 13.5,
                  color: CB_COLORS.textPrimary, outline: 'none', background: 'white',
                }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={filterRol} onChange={e => setFilterRol(e.target.value)}
                style={{
                  height: 34, padding: '0 28px 0 10px', border: `1px solid ${CB_COLORS.border}`, borderRadius: 6,
                  background: 'white', fontFamily: "'Alegreya Sans', serif", fontSize: 13.5,
                  color: CB_COLORS.textPrimary, outline: 'none', appearance: 'none', minWidth: 160,
                }}>
                <option value="">Todos los roles</option>
                <option value="admin">Admin</option>
                <option value="operativo">Operativo</option>
                <option value="visualizador">Visualizador</option>
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Icon name="chevron-down" size={12} color={CB_COLORS.textMuted} />
              </span>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>
              {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            </div>
          </div>

          <UsuariosTable rows={filtered} onEdit={setEditing} />
        </Card>
      )}

      {tab === 'actividad' && isAdmin && <ActividadTab />}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {editing && <EditModal user={editing} canChangeRole={isAdmin} onClose={() => setEditing(null)} />}
    </AppShell>
  );
}
