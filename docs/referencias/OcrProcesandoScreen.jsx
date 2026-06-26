// Cruz Blanca — OCR Paso 2: Procesando documentos (post-upload)

function StepperProc({ current }) {
  const steps = [
    { n: 1, label: 'Subir documento',       icon: 'upload'       },
    { n: 2, label: 'Procesamiento',          icon: 'loader'       },
    { n: 3, label: 'Revisión y corrección',  icon: 'pencil-line'  },
    { n: 4, label: 'Confirmación',           icon: 'check-circle' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => {
        const done = s.n < current, active = s.n === current, pending = s.n > current;
        const cc = done ? CB_COLORS.success : active ? CB_COLORS.primary : '#CBD5E1';
        const cb = done ? CB_COLORS.successLight : active ? '#E6EEF8' : '#F1F5F9';
        const lc = done ? CB_COLORS.successDark : active ? CB_COLORS.primary : CB_COLORS.textMuted;
        return (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: cb, border: `2px solid ${cc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {done
                  ? <Icon name="check" size={16} color={CB_COLORS.successDark} />
                  : <Icon name={s.icon} size={16} color={cc} style={active && s.icon === 'loader' ? { animation: 'spin 1.4s linear infinite' } : {}} />}
              </div>
              <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 12, fontWeight: active ? 500 : 400, color: lc, whiteSpace: 'nowrap', textAlign: 'center' }}>
                <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10, display: 'block', color: pending ? '#CBD5E1' : cc, marginBottom: 1 }}>Paso {s.n}</span>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: done ? CB_COLORS.success : '#E2E8F0', margin: '0 10px', marginBottom: 22, minWidth: 24 }}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Spinner ring
function Spinner({ size = 56 }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} viewBox="0 0 50 50" style={{ animation: 'spin 1.2s linear infinite' }}>
        <circle cx="25" cy="25" r="20" fill="none" stroke="#E6EEF8" strokeWidth="4"></circle>
        <circle cx="25" cy="25" r="20" fill="none" stroke={CB_COLORS.primary} strokeWidth="4"
          strokeLinecap="round" strokeDasharray="90 200" />
      </svg>
    </div>
  );
}

function OcrProcesandoScreen() {
  const [navActive, setNavActive] = React.useState('carga');

  // Resumen de lo subido (mock — vendría del paso 1)
  const resumen = {
    programa: 'EDUCA',
    programaColor: '#C83C3E',
    programaLight: '#FDEAEA',
    actividad: 'EDUCA 2025-1',
    archivos: 5,
    fecha: new Date().toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  };

  // Archivos que fallaron durante el procesamiento (mock)
  const fallidos = [
    { nombre: 'ficha_educa_012.jpg', razon: 'Imagen borrosa: no se pudo reconocer el texto del documento.' },
    { nombre: 'ficha_educa_027.pdf', razon: 'Documento incompleto: faltan páginas requeridas para la extracción.' },
    { nombre: 'ficha_educa_031.png', razon: 'Formato no compatible: la resolución es menor a la mínima permitida.' },
  ];

  return (
    <AppShell
      active={navActive}
      onNavigate={setNavActive}
      title="OCR / Digitalización"
      subtitle="Extracción automática de datos desde fichas físicas"
      user={{ name: 'Carmen Huamán', role: 'Operativo' }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slide { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 26, fontWeight: 700, color: CB_COLORS.textPrimary }}>Procesando documentos</div>
        <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textMuted, marginTop: 2 }}>La IA está extrayendo datos de los archivos que subiste</div>
      </div>

      <StepperProc current={2} />

      <Card style={{ maxWidth: 720, margin: '0 auto', padding: 0, overflow: 'hidden' }}>
        {/* Hero processing block */}
        <div style={{
          padding: '36px 32px 28px',
          background: `linear-gradient(180deg, #FAFBFD 0%, white 100%)`,
          borderBottom: `1px solid ${CB_COLORS.border}`,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <Spinner size={64} />
          </div>
          <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 18, fontWeight: 600, color: CB_COLORS.textPrimary, marginBottom: 8 }}>
            Estamos procesando tus documentos
          </div>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, color: CB_COLORS.textSecondary, lineHeight: 1.55, maxWidth: 480, margin: '0 auto 18px' }}>
            En unos minutos estarán listos para revisión. Puedes cerrar esta ventana o continuar con otra tarea — te avisaremos cuando terminen.
          </div>
        </div>

        {/* Resumen */}
        <div style={{ padding: '20px 32px 24px' }}>
          <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 13, fontWeight: 600, color: CB_COLORS.textSecondary, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12 }}>
            Resumen de la carga
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            background: '#FAFBFC', border: `1px solid ${CB_COLORS.border}`,
            borderRadius: 8, padding: '14px 16px',
          }}>
            <div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: CB_COLORS.textMuted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Programa</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px',
                background: resumen.programaLight, borderRadius: 4,
                fontFamily: "'Alegreya Sans', serif", fontSize: 12.5, fontWeight: 600, color: resumen.programaColor,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: resumen.programaColor }}></span>
                {resumen.programa}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: CB_COLORS.textMuted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Actividad</div>
              <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textPrimary }}>
                {resumen.actividad}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: CB_COLORS.textMuted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Archivos</div>
              <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13.5, fontWeight: 500, color: CB_COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="files" size={14} color={CB_COLORS.primary} />
                {resumen.archivos} documentos
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: CB_COLORS.textMuted, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Cargado</div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12.5, color: CB_COLORS.textSecondary }}>
                {resumen.fecha}
              </div>
            </div>
          </div>
        </div>

        {/* Archivos fallidos */}
        {fallidos.length > 0 && (
          <div style={{ padding: '0 32px 24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: "'Alegreya Sans SC', serif", fontSize: 13, fontWeight: 600,
              color: '#B42318', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              <Icon name="alert-triangle" size={14} color="#B42318" />
              Archivos que fallaron
              <span style={{
                fontFamily: "'Arimo', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 0,
                background: '#FEE4E2', color: '#B42318', borderRadius: 10, padding: '1px 8px',
              }}>{fallidos.length}</span>
            </div>
            <div style={{
              border: '1px solid #FDA29B', borderRadius: 10, overflow: 'hidden', background: '#FFFBFA',
            }}>
              {fallidos.map((f, i) => (
                <div key={f.nombre} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 18px',
                  borderTop: i === 0 ? 'none' : '1px solid #FEE4E2',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: '#FEE4E2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon name="file-x" size={17} color="#B42318" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 13, fontWeight: 700, color: CB_COLORS.textPrimary, marginBottom: 3, wordBreak: 'break-all' }}>
                      {f.nombre}
                    </div>
                    <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: '#B42318', lineHeight: 1.45 }}>
                      {f.razon}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "'Arimo', sans-serif", fontSize: 10.5, fontWeight: 700,
                    letterSpacing: '.05em', textTransform: 'uppercase',
                    background: '#FEE4E2', color: '#B42318', borderRadius: 4, padding: '3px 8px',
                    flexShrink: 0, marginTop: 1,
                  }}>Fallido</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximo paso */}
        <div style={{ padding: '0 32px 24px' }}>
          <div style={{
            border: `1.5px solid ${CB_COLORS.primary}`,
            borderRadius: 10,
            background: '#F4F8FD',
            padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'white',
              border: `1.5px solid ${CB_COLORS.primary}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name="upload-cloud" size={20} color={CB_COLORS.primary} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 600, color: CB_COLORS.textPrimary, marginBottom: 3 }}>
                ¿Tienes más archivos para subir?
              </div>
              <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textSecondary, lineHeight: 1.5 }}>
                Puedes seguir cargando archivos de otro tipo de actividad mientras estos se procesan.
              </div>
            </div>
            <a href="OCR Paso 1.html" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 6, border: 'none',
              background: CB_COLORS.primary, color: 'white',
              fontFamily: "'Alegreya Sans', serif", fontSize: 14, fontWeight: 500,
              cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'opacity .15s', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <Icon name="plus" size={15} color="white" />
              Subir archivos de otra actividad
            </a>
          </div>
        </div>

        {/* Footer secondary link */}
        <div style={{
          padding: '14px 32px',
          borderTop: `1px solid ${CB_COLORS.border}`,
          background: '#FAFBFC',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>
            <Icon name="info" size={12} color={CB_COLORS.textMuted} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Verás todos los lotes en proceso y finalizados en la bandeja de triaje.
          </div>
          <a href="TriajeLotes.html" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
            color: CB_COLORS.primary, textDecoration: 'none',
          }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            Ir a la bandeja de triaje
            <Icon name="arrow-right" size={13} color={CB_COLORS.primary} />
          </a>
        </div>
      </Card>
    </AppShell>
  );
}

Object.assign(window, { OcrProcesandoScreen });
