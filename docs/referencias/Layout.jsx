// Cruz Blanca — Shared Layout Components
// Sidebar, Topbar, Layout shell

const CB_COLORS = {
  primary: '#0C529B', primaryDark: '#094480', white: '#FFFFFF',
  bgApp: '#F4F6F9', bgCard: '#FFFFFF', border: '#E2E8F0',
  textPrimary: '#1A2332', textSecondary: '#4A5568', textMuted: '#718096',
  success: '#6CAB5F', successLight: '#EBF5E9', successDark: '#4E8B42',
  error: '#C83C3E', errorLight: '#FDEAEA', errorDark: '#A62E30',
  warning: '#D98831', warningLight: '#FDF3E3', warningDark: '#B56E1F',
  info: '#5292B5', infoLight: '#E8F2F8', infoDark: '#3A7499',
  purple: '#625696', purpleLight: '#EEEAF7',
};

const PROGRAMS = [
  { id: 'educa',       label: 'Cruz Blanca Educa',        color: '#C83C3E', light: '#FDEAEA', dark: '#A62E30' },
  { id: 'familia',     label: 'Cruz Blanca En Familia',   color: '#625696', light: '#EEEAF7', dark: '#4A3B78' },
  { id: 'accion',      label: 'Cruz Blanca En Acción',    color: '#D98831', light: '#FDF3E3', dark: '#B56E1F' },
  { id: 'campamentos', label: 'Cruz Blanca Campamentos',  color: '#5292B5', light: '#E8F2F8', dark: '#3A7499' },
  { id: 'missions',    label: 'Cruz Blanca Missions',     color: '#6CAB5F', light: '#EBF5E9', dark: '#4E8B42' },
];

const NAV_ITEMS = [
  { id: 'inicio',        label: 'Inicio',          icon: 'home' },
  { id: 'beneficiarios', label: 'Beneficiarios',   icon: 'users' },
  { id: 'carga',         label: 'Carga de datos',  icon: 'upload-cloud', href: 'OCR Paso 1.html' },
  { id: 'reportes',      label: 'Reportes',        icon: 'file-text' },
  { id: 'usuarios',      label: 'Usuarios',        icon: 'user-cog' },
];

const layoutStyles = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: CB_COLORS.bgApp },
  sidebar: {
    width: 240, flexShrink: 0, background: CB_COLORS.primary,
    display: 'flex', flexDirection: 'column', boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
    overflowY: 'auto',
  },
  sbHeader: { padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' },
  sbLogoRow: { display: 'flex', alignItems: 'center', gap: 10 },
  sbLogoText: { fontFamily: "'Alegreya Sans SC', serif", fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.2 },
  sbLogoSub: { fontSize: 9, fontWeight: 400, opacity: .65, letterSpacing: '.04em', display: 'block' },
  sbSection: { padding: '10px 0 4px' },
  sbSectionLabel: { fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 16px 4px', fontFamily: "'Arimo', sans-serif" },
  sbItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
    cursor: 'pointer', color: active ? 'white' : 'rgba(255,255,255,0.78)',
    fontSize: 13.5, fontWeight: active ? 500 : 400, fontFamily: "'Alegreya Sans', serif",
    background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
    borderLeft: active ? '3px solid white' : '3px solid transparent',
    transition: 'background .12s',
  }),
  sbFooter: { marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.12)', padding: '10px 0 0' },
  sbVersion: { fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '0 16px 8px', fontFamily: "'Arimo', sans-serif" },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: {
    height: 60, background: 'white', borderBottom: `1px solid ${CB_COLORS.border}`,
    display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
    flexShrink: 0, justifyContent: 'space-between',
  },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  content: { flex: 1, overflowY: 'auto', padding: 24 },
  pageTitle: { fontFamily: "'Alegreya Sans SC', serif", fontSize: 26, fontWeight: 700, color: CB_COLORS.textPrimary, lineHeight: 1.2, letterSpacing: '-0.01em' },
  pageSub: { fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textMuted, marginTop: 2 },
  topbarTitle: { fontFamily: "'Alegreya Sans SC', serif", fontSize: 15, fontWeight: 500, color: CB_COLORS.textPrimary },
};

function Icon({ name, size = 16, color, style = {} }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 }, rootElement: ref.current });
  });
  return <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center', color: color, ...style }}><i data-lucide={name} style={{ width: size, height: size }}></i></span>;
}

function Avatar({ name, size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: CB_COLORS.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Arimo', sans-serif", fontSize: size * 0.38, fontWeight: 500, flexShrink: 0 }}>{initials}</div>
  );
}

function Badge({ type = 'success', children, dot }) {
  const map = {
    success: { bg: CB_COLORS.successLight, color: CB_COLORS.successDark },
    error:   { bg: CB_COLORS.errorLight,   color: CB_COLORS.errorDark },
    warning: { bg: CB_COLORS.warningLight, color: CB_COLORS.warningDark },
    info:    { bg: CB_COLORS.infoLight,    color: CB_COLORS.infoDark },
    purple:  { bg: CB_COLORS.purpleLight,  color: '#4A3B78' },
    primary: { bg: '#E6EEF8',              color: CB_COLORS.primaryDark },
    gray:    { bg: '#F1F5F9',              color: CB_COLORS.textSecondary },
  };
  const s = map[type] || map.gray;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color, fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 500 }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }}></span>}
      {children}
    </span>
  );
}

function Btn({ variant = 'primary', size = 'md', children, onClick, icon }) {
  const base = { border: 'none', cursor: 'pointer', fontFamily: "'Alegreya Sans', serif", fontWeight: 500, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity .15s', whiteSpace: 'nowrap' };
  const variants = {
    primary:   { background: CB_COLORS.primary,  color: 'white', border: 'none' },
    secondary: { background: 'white', color: CB_COLORS.primary, border: `1.5px solid ${CB_COLORS.primary}` },
    danger:    { background: CB_COLORS.error,    color: 'white', border: 'none' },
    ghost:     { background: 'transparent', color: CB_COLORS.primary, border: 'none' },
  };
  const sizes = { sm: { fontSize: 13, padding: '5px 12px' }, md: { fontSize: 14, padding: '8px 16px' }, lg: { fontSize: 16, padding: '10px 24px' } };
  return <button style={{ ...base, ...variants[variant], ...sizes[size] }} onClick={onClick}>{icon && <Icon name={icon} size={14} />}{children}</button>;
}

function Card({ children, style = {}, padding = 20 }) {
  return <div style={{ background: 'white', borderRadius: 8, border: `1px solid ${CB_COLORS.border}`, boxShadow: '0 1px 3px rgba(12,82,155,0.08)', padding, ...style }}>{children}</div>;
}

function Sidebar({ active, onNavigate, user }) {
  return (
    <div style={layoutStyles.sidebar}>
      <div style={layoutStyles.sbHeader}>
        <div style={layoutStyles.sbLogoRow}>
          <img src="assets/logo-cruz-blanca-principal.svg" style={{ width: 32, height: 32, filter: 'brightness(0) invert(1)' }} onError={e => e.target.style.display='none'} alt="CB" />
          <div style={layoutStyles.sbLogoText}>Cruz Blanca<span style={layoutStyles.sbLogoSub}>Sistema de Gestión</span></div>
        </div>
      </div>
      <div style={{ padding: '14px 0 4px' }}>
        {NAV_ITEMS.map(item => (
          <div key={item.id} style={layoutStyles.sbItem(active === item.id)}
            onClick={() => { if (item.href) window.location.href = item.href; else onNavigate(item.id); }}
            onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.background = 'transparent'; }}>
            <Icon name={item.icon} size={16} color="currentColor" />
            {item.label}
          </div>
        ))}
      </div>
      <div style={layoutStyles.sbFooter}>
        <div style={layoutStyles.sbVersion}>v1.0.0 · Abril 2026</div>
        <div style={layoutStyles.sbItem(false)}>
          <Icon name="log-out" size={16} color="currentColor" />
          Cerrar sesión
        </div>
      </div>
    </div>
  );
}

function Topbar({ title, subtitle, actions, user = { name: 'Admin Cruz Blanca', role: 'Administrador' } }) {
  return (
    <div style={layoutStyles.topbar}>
      <div style={layoutStyles.topbarLeft}>
        <div>
          <div style={layoutStyles.topbarTitle}>{title}</div>
          {subtitle && <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted }}>{subtitle}</div>}
        </div>
      </div>
      <div style={layoutStyles.topbarRight}>
        {actions}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: `1px solid ${CB_COLORS.border}` }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500, color: CB_COLORS.textPrimary }}>{user.name}</div>
            <Badge type="primary">{user.role}</Badge>
          </div>
          <Avatar name={user.name} size={34} />
        </div>
      </div>
    </div>
  );
}

function AppShell({ active, onNavigate, children, title, subtitle, topActions, user }) {
  return (
    <div style={layoutStyles.shell}>
      <Sidebar active={active} onNavigate={onNavigate} user={user} />
      <div style={layoutStyles.main}>
        <Topbar title={title} subtitle={subtitle} actions={topActions} user={user} />
        <div style={layoutStyles.content}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { CB_COLORS, PROGRAMS, Icon, Badge, Btn, Card, AppShell, Sidebar, Topbar });
