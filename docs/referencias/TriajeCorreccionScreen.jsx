// Cruz Blanca — Triaje: Corrección de un Registro
// Adaptado a la estructura real del response del expediente:
//   { status, dossier_data:{ beneficiary, related_adults, education, medical, religion, permissions }, discrepancies:[…] }

// ── Response de ejemplo (misma forma que llegará del backend) ───────────────
const RESPONSE = {
  status: 'PENDING_REVIEW',
  dossier_data: {
    beneficiary: {
      dni: '78739850', first_name: 'SORAIA', last_name: 'HJAMAN CHACON',
      birth_date: '2014-08-14', gender: 'F', address: null, validation_issues: [],
    },
    related_adults: {
      adults: [
        { relationship: 'FATHER', dni: '47545015', full_name: 'MARCO HUAMAN COCHACKIN', phone: null },
        { relationship: 'MOTHER', dni: '48100010', full_name: 'MILAGRO CHACON QUISPE', phone: null },
      ],
      guardian_dni: '48100010', validation_issues: [],
    },
    education: { school: 'josé de san martin', grade: '5to', knows_read: true, knows_write: true, repeated_grade: true, learning_difficulties: true },
    medical: { allergies: [], diseases: [], insurance: ['SIS'], has_been_operated: false, operation_reason: null, has_been_hospitalized: false, hospitalization_reason: 'problemas digestivos', vaccines: ['Completas', 'Tétanos'], medications: [] },
    religion: { baptized: null, first_communion: null, validation_issues: [] },
    permissions: { haircut_permission: null, medical_exams_permission: null, validation_issues: [] },
  },
  discrepancies: [
    { field_name: 'Número de Documento', expected_pattern: 'Formato de DNI válido', actual_value: 'DNI30- 8', rule_description: 'El documento DNI del beneficiario no es válido', severity: 'WARNING', document_code: 'DNIBE' },
    { field_name: 'related_adults.phone', expected_pattern: 'Al menos 1 teléfono', actual_value: '(vacío)', rule_description: 'Debe existir al menos un número de emergencia (teléfono) registrado para los adultos relacionados.', severity: 'ERROR', document_code: 'DOMINIO' },
  ],
};

const DOCUMENTOS = [
  { id: 'fins',  nombre: 'Ficha de inscripción', img: 'assets/ejemplo_ficha_inscripcion.jpeg' },
  { id: 'dni_n', nombre: 'DNI Niño',             img: 'assets/ejemplo_dni_nino.jpeg' },
  { id: 'dni_m', nombre: 'DNI Mamá',             img: 'assets/ejemplo_dni_mama.jpeg' },
  { id: 'dni_p', nombre: 'DNI Papá',             img: 'assets/ejemplo_dni_papa.jpeg' },
  { id: 'dj',    nombre: 'Declaración Jurada',   img: 'assets/ejemplo_declaracion_jurada.jpeg' },
];

// ── Opciones de campos multi-select (del formulario de inscripción) ─────────
const SEGURO_OPTIONS     = ['S.I.S.', 'ESSALUD', 'FOSPOLI'];
const ALERGIA_OPTIONS    = ['Analgésicos (AINES)', 'Sulfas', 'Penicilina', 'Pescado / Mariscos', 'Cítricos', 'Leche'];
const ENFERMEDAD_OPTIONS = ['Tuberculosis', 'Convulsiones', 'Cáncer', 'Varicela', 'Parásitos'];
const VACUNA_OPTIONS     = ['Completas', 'Incompletas'];

// Normaliza los valores crudos del response a las etiquetas canónicas de opciones
// (p.ej. 'SIS' → 'S.I.S.'); lo que no coincide se conserva como valor libre ("Otros").
function normArr(arr, options) {
  if (!Array.isArray(arr)) return [];
  const norm = s => String(s).toLowerCase().replace(/[.\s]/g, '');
  return arr.map(v => { const hit = options.find(o => norm(o) === norm(v)); return hit || v; });
}

// ── Helpers de formato ──────────────────────────────────────────────────────
function titleCase(s) { if (!s) return ''; return String(s).toLowerCase().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' '); }
function fmtDate(iso) { if (!iso) return ''; const p = iso.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso; }
function ageFrom(iso) {
  if (!iso) return '';
  const b = new Date(iso), now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const md = now.getMonth() - b.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < b.getDate())) a--;
  return String(a);
}
function siNo(v) { return v === true ? 'Sí' : v === false ? 'No' : ''; }
function genderLabel(g) { return g === 'F' ? 'Femenino' : g === 'M' ? 'Masculino' : (g || ''); }
function joinOr(arr, fallback = '') { return (Array.isArray(arr) && arr.length) ? arr.join(', ') : fallback; }

const SEVERITY_LABEL = { ERROR: 'Error', WARNING: 'Advertencia' };

// ── Estados de validación de un campo ───────────────────────────────────────
const STATUS_META = {
  ok:      { color: CB_COLORS.success,    bg: CB_COLORS.successLight, label: 'Validado',     icon: 'check-circle' },
  warning: { color: CB_COLORS.warning,    bg: CB_COLORS.warningLight, label: 'Advertencia',  icon: 'alert-triangle' },
  error:   { color: CB_COLORS.error,      bg: CB_COLORS.errorLight,   label: 'Error',         icon: 'alert-octagon' },
  empty:   { color: CB_COLORS.textMuted,  bg: '#F1F5F9',              label: 'Por completar', icon: 'pencil' },
};

// ── Construye la lista de campos a partir del response ──────────────────────
function buildFields(resp) {
  const d = resp.dossier_data;
  const b = d.beneficiary, ed = d.education, m = d.medical, rel = d.religion, perm = d.permissions;
  const adults = d.related_adults.adults || [];
  const father = adults.find(a => a.relationship === 'FATHER') || {};
  const mother = adults.find(a => a.relationship === 'MOTHER') || {};
  const guardian = adults.find(a => a.dni === d.related_adults.guardian_dni) || {};
  const guardianRel = guardian.relationship === 'MOTHER' ? 'Madre' : guardian.relationship === 'FATHER' ? 'Padre' : 'Apoderado';
  const guardianDoc = guardian.relationship === 'MOTHER' ? 'dni_m' : 'dni_p';

  const raw = [
    // Beneficiario
    { id: 'nombre',    label: 'Nombres',               value: titleCase(b.first_name), group: 'Beneficiario' },
    { id: 'apellido',  label: 'Apellidos',             value: titleCase(b.last_name),  group: 'Beneficiario' },
    { id: 'dni_n',     label: 'DNI del niño',          value: b.dni || '',             group: 'Beneficiario', doc: 'dni_n', match: { codes: ['DNIBE'], fields: ['Número de Documento'] } },
    { id: 'fecha_nac', label: 'Fecha de nacimiento',   value: fmtDate(b.birth_date),   group: 'Beneficiario' },
    { id: 'edad',      label: 'Edad (años)',           value: ageFrom(b.birth_date),   group: 'Beneficiario' },
    { id: 'genero',    label: 'Género',                value: genderLabel(b.gender),   type: 'select', options: ['Femenino', 'Masculino'], group: 'Beneficiario' },
    { id: 'direccion', label: 'Dirección',             value: b.address || '',         group: 'Beneficiario', placeholder: 'No consignada en la ficha' },

    // Educación
    { id: 'colegio',      label: 'Colegio',                        value: titleCase(ed.school),      group: 'Educación' },
    { id: 'grado',        label: 'Grado',                          value: ed.grade || '',            group: 'Educación' },
    { id: 'sabe_leer',    label: '¿Sabe leer?',                    value: ed.knows_read,             type: 'bool', group: 'Educación' },
    { id: 'sabe_escribir',label: '¿Sabe escribir?',                value: ed.knows_write,            type: 'bool', group: 'Educación' },
    { id: 'repetido',     label: '¿Ha repetido de grado?',         value: ed.repeated_grade,         type: 'bool', group: 'Educación' },
    { id: 'dificultades', label: '¿Dificultades de aprendizaje?',  value: ed.learning_difficulties,  type: 'bool', group: 'Educación' },

    // Salud
    { id: 'seguro',       label: 'Tipo de seguro',            type: 'multi', options: SEGURO_OPTIONS,     otrosLabel: 'Otro — ¿Cuál?', value: normArr(m.insurance, SEGURO_OPTIONS),      group: 'Salud' },
    { id: 'alergias',     label: 'Alergias',                  type: 'multi', options: ALERGIA_OPTIONS,    otrosLabel: 'Otros — ¿Qué?', emptyOk: true, value: normArr(m.allergies, ALERGIA_OPTIONS), group: 'Salud' },
    { id: 'enfermedades', label: 'Enfermedades que ha tenido', type: 'multi', options: ENFERMEDAD_OPTIONS, otrosLabel: 'Otros',       emptyOk: true, value: normArr(m.diseases, ENFERMEDAD_OPTIONS), group: 'Salud' },
    { id: 'vacunas',      label: 'Vacunas',                   type: 'multi', options: [], freeform: true, otrosLabel: 'Agregar vacuna', emptyOk: true, value: normArr(m.vaccines, []), group: 'Salud' },
    { id: 'medicamentos', label: 'Medicamentos',              type: 'multi', options: [], freeform: true, otrosLabel: 'Agregar medicamento', emptyOk: true, value: normArr(m.medications, []), group: 'Salud' },
    { id: 'operado',      label: '¿Ha sido operado?',         value: m.has_been_operated,                 type: 'bool', group: 'Salud' },
    { id: 'motivo_oper',  label: 'Motivo de operación',       value: m.operation_reason || '',            group: 'Salud', placeholder: 'Sin motivo registrado' },
    { id: 'hospitalizado',label: '¿Ha sido hospitalizado?',   value: m.has_been_hospitalized,             type: 'bool', group: 'Salud' },
    { id: 'motivo_hosp',  label: 'Motivo de hospitalización', value: m.hospitalization_reason || '',      group: 'Salud', placeholder: 'Sin motivo registrado' },

    // Religión y permisos
    { id: 'bautizado',  label: '¿Fue bautizado?',              value: rel.baptized,                     type: 'bool', group: 'Religión y permisos' },
    { id: 'comunion',   label: '¿Hizo la 1ra comunión?',       value: rel.first_communion,              type: 'bool', group: 'Religión y permisos' },
    { id: 'corte_pelo', label: '¿Autoriza corte de cabello?',  value: perm.haircut_permission,          type: 'bool', group: 'Religión y permisos' },
    { id: 'examenes',   label: '¿Autoriza exámenes médicos?',  value: perm.medical_exams_permission,    type: 'bool', group: 'Religión y permisos' },

    // Padre
    { id: 'padre_nom', label: 'Nombre del padre',   value: titleCase(father.full_name), group: 'Padre', doc: 'dni_p', placeholder: 'No registrado' },
    { id: 'padre_dni', label: 'DNI del padre',      value: father.dni || '',            group: 'Padre', doc: 'dni_p', placeholder: 'No registrado' },
    { id: 'padre_tel', label: 'Teléfono del padre', value: father.phone || '',          group: 'Padre', placeholder: 'Sin teléfono' },

    // Madre
    { id: 'madre_nom', label: 'Nombre de la madre',   value: titleCase(mother.full_name), group: 'Madre', doc: 'dni_m', placeholder: 'No registrado' },
    { id: 'madre_dni', label: 'DNI de la madre',      value: mother.dni || '',            group: 'Madre', doc: 'dni_m', placeholder: 'No registrado' },
    { id: 'madre_tel', label: 'Teléfono de la madre', value: mother.phone || '',          group: 'Madre', placeholder: 'Sin teléfono' },

    // Apoderado
    { id: 'apod_nom', label: 'Nombre del apoderado',   value: titleCase(guardian.full_name), group: 'Apoderado', doc: guardianDoc, note: `Apoderado de registro · ${guardianRel}`, placeholder: 'No registrado' },
    { id: 'apod_dni', label: 'DNI del apoderado',      value: guardian.dni || '',            group: 'Apoderado', doc: guardianDoc, placeholder: 'No registrado' },
    { id: 'apod_tel', label: 'Teléfono del apoderado', value: guardian.phone || '',          group: 'Apoderado', match: { fields: ['related_adults.phone'] }, emergency: true, placeholder: 'Teléfono de emergencia' },
  ];

  return raw.map(f => {
    const disc = f.match ? resp.discrepancies.find(x =>
      (f.match.codes && f.match.codes.includes(x.document_code)) ||
      (f.match.fields && f.match.fields.includes(x.field_name))
    ) : null;
    const isBlank = f.type === 'bool' ? (f.value === null || f.value === undefined)
      : f.type === 'multi' ? (!Array.isArray(f.value) || f.value.length === 0)
      : !f.value;
    let status, error = null;
    if (disc) {
      status = disc.severity === 'ERROR' ? 'error' : 'warning';
      error = disc.rule_description;
      if (disc.actual_value && disc.actual_value !== '(vacío)') error += `  ·  leído: “${disc.actual_value}”`;
    } else if (isBlank && !f.emptyOk) {
      status = 'empty';
    } else {
      status = 'ok';
    }
    return { ...f, status, error, discrepancy: disc || null };
  });
}

// ── Document viewer (izquierda) ─────────────────────────────────────────────
function DocViewer({ activeDocId, onSelectDoc, autoSwitchHint }) {
  const [zoom, setZoom] = React.useState(1);
  const doc = DOCUMENTOS.find(d => d.id === activeDocId) || DOCUMENTOS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${CB_COLORS.border}`, overflowX: 'auto', flexShrink: 0 }}>
        {DOCUMENTOS.map(d => {
          const active = d.id === activeDocId;
          return (
            <button key={d.id} onClick={() => onSelectDoc(d.id, false)} style={{
              padding: '8px 12px', border: 'none', background: 'transparent',
              borderBottom: `2.5px solid ${active ? CB_COLORS.primary : 'transparent'}`,
              fontFamily: "'Alegreya Sans', serif", fontSize: 12.5,
              fontWeight: active ? 600 : 400,
              color: active ? CB_COLORS.primary : CB_COLORS.textMuted,
              cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1,
              transition: 'color .15s, border-color .15s',
            }}>
              {d.nombre}
            </button>
          );
        })}
      </div>

      {/* Auto-switch hint */}
      {autoSwitchHint && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 11px', borderRadius: 6,
          background: '#E6EEF8', color: CB_COLORS.primaryDark,
          fontFamily: "'Arimo', sans-serif", fontSize: 11.5,
          border: `1px solid ${CB_COLORS.primary}33`,
          flexShrink: 0,
        }}>
          <Icon name="info" size={13} color={CB_COLORS.primary} />
          <span>Mostrando <strong>{doc.nombre}</strong> para verificar el campo seleccionado</span>
        </div>
      )}

      {/* Zoom toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 12.5, fontWeight: 600, color: CB_COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="image" size={13} color={CB_COLORS.primary} />
          {doc.nombre}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${CB_COLORS.border}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="minus" size={12} color={CB_COLORS.textSecondary} />
          </button>
          <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textMuted, minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))} style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${CB_COLORS.border}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={12} color={CB_COLORS.textSecondary} />
          </button>
          <button onClick={() => setZoom(1)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${CB_COLORS.border}`, background: 'white', cursor: 'pointer', fontFamily: "'Arimo', sans-serif", fontSize: 11, color: CB_COLORS.textSecondary }}>
            Ajustar
          </button>
        </div>
      </div>

      {/* Image canvas */}
      <div style={{ flex: 1, overflow: 'auto', background: '#1A2332', borderRadius: 8, padding: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <img src={doc.img} alt={doc.nombre} style={{
          maxWidth: 'none', width: `${100 * zoom}%`,
          background: 'white', borderRadius: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          transition: 'width .15s',
        }} />
      </div>
    </div>
  );
}

// ── Multi-select con opciones + "Otros" (valor = array de strings) ──────────
function MultiSelect({ options, value, onChange, otrosLabel = 'Otros', freeform = false }) {
  const val = Array.isArray(value) ? value : [];
  const norm = s => String(s).toLowerCase().replace(/[.\s]/g, '');
  const optNorms = options.map(norm);
  const custom = val.filter(v => !optNorms.includes(norm(v)));
  const [draft, setDraft] = React.useState('');
  const [showOtros, setShowOtros] = React.useState(false);
  const chipBorder = freeform ? CB_COLORS.primary : CB_COLORS.purple;
  const chipBg = freeform ? '#EEF5FF' : CB_COLORS.purpleLight;
  const chipText = freeform ? CB_COLORS.primaryDark : '#4A3B78';

  const isSel = opt => val.some(v => norm(v) === norm(opt));
  const toggle = opt => onChange(isSel(opt) ? val.filter(v => norm(v) !== norm(opt)) : [...val, opt]);
  const addCustom = () => {
    const t = draft.trim();
    if (t && !val.some(v => norm(v) === norm(t))) onChange([...val, t]);
    setDraft('');
  };
  const removeCustom = c => onChange(val.filter(v => v !== c));

  return (
    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => {
          const sel = isSel(opt);
          return (
            <button key={opt} onClick={() => toggle(opt)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999,
              border: `1.5px solid ${sel ? CB_COLORS.primary : CB_COLORS.border}`,
              background: sel ? CB_COLORS.primary : 'white', color: sel ? 'white' : CB_COLORS.textSecondary,
              fontFamily: "'Alegreya Sans', serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .12s',
            }}>
              {sel && <Icon name="check" size={12} color="white" />}
              {opt}
            </button>
          );
        })}
        {custom.map(c => (
          <span key={c} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 7px 5px 10px', borderRadius: 999,
            border: `1.5px solid ${chipBorder}`, background: chipBg, color: chipText,
            fontFamily: "'Alegreya Sans', serif", fontSize: 12, fontWeight: 500,
          }}>
            {c}
            <button onClick={() => removeCustom(c)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', padding: 0, alignItems: 'center' }}>
              <Icon name="x" size={12} color={chipText} />
            </button>
          </span>
        ))}
        <button onClick={() => setShowOtros(s => !s)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999,
          border: `1.5px dashed ${showOtros ? CB_COLORS.primary : CB_COLORS.border}`, background: 'white',
          color: showOtros ? CB_COLORS.primary : CB_COLORS.textMuted,
          fontFamily: "'Alegreya Sans', serif", fontSize: 12, fontWeight: 500, cursor: 'pointer',
        }}>
          <Icon name="plus" size={12} color={showOtros ? CB_COLORS.primary : CB_COLORS.textMuted} />
          {otrosLabel}
        </button>
      </div>
      {showOtros && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            placeholder="Especificar y presionar Enter…" autoFocus style={{
              flex: 1, height: 30, border: `1.5px solid ${CB_COLORS.border}`, borderRadius: 4, padding: '0 9px',
              fontFamily: "'Arimo', sans-serif", fontSize: 12.5, color: CB_COLORS.textPrimary, outline: 'none',
            }} />
          <button onClick={addCustom} style={{
            padding: '0 12px', height: 30, borderRadius: 4, border: 'none', background: CB_COLORS.primary, color: 'white',
            fontFamily: "'Alegreya Sans', serif", fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          }}>Agregar</button>
        </div>
      )}
    </div>
  );
}

// ── Control segmentado Sí/No para campos boolean ───────────────────────────
function BoolToggle({ value, active, onChange, meta }) {
  const opts = [{ v: true, label: 'Sí' }, { v: false, label: 'No' }];
  return (
    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
      {opts.map(o => {
        const sel = value === o.v;
        const c = o.v ? CB_COLORS.success : CB_COLORS.error;
        return (
          <button key={String(o.v)} onClick={() => onChange(sel ? null : o.v)} style={{
            flex: 1, height: 32, borderRadius: 5, cursor: 'pointer',
            border: `1.5px solid ${sel ? c : CB_COLORS.border}`,
            background: sel ? c : 'white',
            color: sel ? 'white' : CB_COLORS.textSecondary,
            fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all .12s',
          }}>
            {sel && <Icon name={o.v ? 'check' : 'x'} size={13} color="white" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Field row (derecha) ─────────────────────────────────────────────────────
function TCFieldRow({ field, isActive, onFocus, onChange, fieldRef }) {
  const meta = STATUS_META[field.status] || STATUS_META.empty;
  const flagged = field.status === 'warning' || field.status === 'error';
  const borderColor = isActive ? CB_COLORS.primary : (flagged ? meta.color + '88' : CB_COLORS.border);
  const inputBorder = flagged ? meta.color : (isActive ? CB_COLORS.primary : CB_COLORS.border);
  const isBool = field.type === 'bool';
  const isMulti = field.type === 'multi';
  const isSelect = field.type === 'select';

  return (
    <div
      ref={fieldRef}
      onClick={onFocus}
      style={{
        padding: '8px 11px', borderRadius: 6,
        background: isActive ? '#EEF5FF' : 'white',
        border: `1px solid ${borderColor}`,
        marginBottom: 5, cursor: 'pointer', transition: 'all .12s',
        boxShadow: isActive ? `0 0 0 2px ${CB_COLORS.primary}22` : 'none',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
        <label style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 11.5, fontWeight: 500, color: CB_COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.2 }}>
          <Icon name={meta.icon} size={11} color={meta.color} />
          {field.label}
          {field.emergency && <span style={{ color: CB_COLORS.error, fontFamily: "'Arimo', sans-serif", fontSize: 10 }}>· emergencia</span>}
        </label>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '1px 7px', borderRadius: 3,
          background: meta.bg, color: meta.color,
          fontFamily: "'Arimo', sans-serif", fontSize: 9.5, fontWeight: 600,
          flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: meta.color }}></span>
          {meta.label}
        </span>
      </div>

      {isMulti ? (
        <MultiSelect options={field.options} value={field.value} onChange={arr => onChange(field.id, arr)} otrosLabel={field.otrosLabel} freeform={field.freeform} />
      ) : isBool ? (
        <BoolToggle value={field.value} active={isActive} onChange={v => onChange(field.id, v)} meta={meta} />
      ) : isSelect ? (
        <select
          value={field.value}
          onChange={e => onChange(field.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          onFocus={onFocus}
          style={{
            width: '100%', height: 32,
            border: `1.5px solid ${inputBorder}`,
            borderRadius: 4, padding: '0 9px',
            fontFamily: "'Arimo', sans-serif", fontSize: 12.5,
            color: field.value ? CB_COLORS.textPrimary : '#94A3B8',
            background: field.status === 'empty' && !isActive ? '#FAFBFC' : 'white',
            outline: 'none', cursor: 'pointer',
          }}>
          <option value="">Seleccionar…</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          value={field.value}
          onChange={e => onChange(field.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          onFocus={onFocus}
          placeholder={field.placeholder || 'Ingresar manualmente…'}
          style={{
            width: '100%', height: 30,
            border: `1.5px solid ${inputBorder}`,
            borderRadius: 4, padding: '0 9px',
            fontFamily: "'Arimo', sans-serif", fontSize: 12.5,
            color: field.value ? CB_COLORS.textPrimary : '#94A3B8',
            background: flagged && !isActive ? meta.bg + '99' : (field.status === 'empty' && !isActive ? '#FAFBFC' : 'white'),
            outline: 'none',
          }}
        />
      )}

      {field.error && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <Icon name="alert-circle" size={10} color={meta.color} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: meta.color, lineHeight: 1.35 }}>{field.error}</span>
        </div>
      )}
      {!field.error && field.note && (
        <div style={{ marginTop: 3, fontFamily: "'Arimo', sans-serif", fontSize: 10, color: CB_COLORS.textMuted }}>{field.note}</div>
      )}
    </div>
  );
}

// ── Panel de validación: conteos + observaciones (discrepancies) ────────────
function ValidationPanel({ fields, status, discrepancies, sectionIssues = [], onJump, onJumpGroup }) {
  const total = fields.length;
  const validos = fields.filter(f => f.status === 'ok').length;
  const adver   = fields.filter(f => f.status === 'warning').length;
  const errores = fields.filter(f => f.status === 'error').length;
  const porComp = fields.filter(f => f.status === 'empty').length;
  const segs = [
    { count: validos, color: CB_COLORS.success,   label: 'validados' },
    { count: adver,   color: CB_COLORS.warning,   label: 'advertencias' },
    { count: errores, color: CB_COLORS.error,     label: 'errores' },
    { count: porComp, color: CB_COLORS.textMuted, label: 'por completar' },
  ];
  return (
    <div style={{ background: 'white', border: `1px solid ${CB_COLORS.border}`, borderRadius: 7, padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 12.5, fontWeight: 600, color: CB_COLORS.textPrimary }}>
          {total} campos del expediente
        </span>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {segs.map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textSecondary }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }}></span>
              <strong style={{ color: s.color }}>{s.count}</strong> {s.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 4, overflow: 'hidden', display: 'flex', gap: 2, background: '#F1F5F9' }}>
        {segs.map((s, i) => s.count > 0 && (
          <div key={i} style={{ height: '100%', width: `${(s.count / total) * 100}%`, background: s.color }}></div>
        ))}
      </div>

      {/* Observaciones = discrepancies + validation_issues de sección */}
      {(discrepancies.length + sectionIssues.length) > 0 && (
        <div style={{ marginTop: 11, paddingTop: 10, borderTop: `1px dashed ${CB_COLORS.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, fontFamily: "'Alegreya Sans SC', serif", fontSize: 11.5, fontWeight: 600, color: CB_COLORS.textPrimary }}>
            <Icon name="clipboard-list" size={13} color={CB_COLORS.primary} />
            {discrepancies.length + sectionIssues.length} observaciones de validación
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {discrepancies.map((d, i) => {
              const isErr = d.severity === 'ERROR';
              const c = isErr ? CB_COLORS.error : CB_COLORS.warning;
              const bg = isErr ? CB_COLORS.errorLight : CB_COLORS.warningLight;
              const targetId = d._fieldId;
              return (
                <div key={'d' + i}
                  onClick={() => targetId && onJump(targetId)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '7px 10px', borderRadius: 6, background: bg, border: `1px solid ${c}33`, cursor: targetId ? 'pointer' : 'default' }}>
                  <Icon name={isErr ? 'alert-octagon' : 'alert-triangle'} size={14} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textPrimary, lineHeight: 1.35 }}>
                      <strong style={{ color: c }}>{SEVERITY_LABEL[d.severity] || d.severity}</strong> · {d.rule_description}
                    </div>
                    <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: CB_COLORS.textMuted, marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>Campo: <strong style={{ color: CB_COLORS.textSecondary }}>{d.field_name}</strong></span>
                      <span>Esperado: {d.expected_pattern}</span>
                      <span>Leído: {d.actual_value}</span>
                      <span style={{ opacity: .7 }}>[{d.document_code}]</span>
                    </div>
                  </div>
                  {targetId && <Icon name="corner-down-right" size={13} color={c} style={{ flexShrink: 0, marginTop: 1 }} />}
                </div>
              );
            })}
            {sectionIssues.map((s, i) => {
              const c = CB_COLORS.warning;
              return (
                <div key={'s' + i}
                  onClick={() => onJumpGroup && onJumpGroup(s.group)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '7px 10px', borderRadius: 6, background: CB_COLORS.warningLight, border: `1px solid ${c}33`, cursor: 'pointer' }}>
                  <Icon name="alert-triangle" size={14} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 11.5, color: CB_COLORS.textPrimary, lineHeight: 1.35 }}>
                      <strong style={{ color: c }}>Observación</strong> · {s.text}
                    </div>
                    <div style={{ fontFamily: "'Arimo', sans-serif", fontSize: 10.5, color: CB_COLORS.textMuted, marginTop: 2 }}>
                      Sección: <strong style={{ color: CB_COLORS.textSecondary }}>{s.section}</strong>
                    </div>
                  </div>
                  <Icon name="corner-down-right" size={13} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
function TriajeCorreccionScreen() {
  const [navActive, setNavActive] = React.useState('triaje');
  const [fields, setFields] = React.useState(() => buildFields(RESPONSE));
  const [activeId, setActiveId] = React.useState(null);
  const [activeGroup, setActiveGroup] = React.useState('Beneficiario');
  const [activeDocId, setActiveDocId] = React.useState('fins');
  const [autoSwitchHint, setAutoSwitchHint] = React.useState(false);
  const fieldRefs = React.useRef({});
  const hintTimerRef = React.useRef(null);

  const b = RESPONSE.dossier_data.beneficiary;
  const beneficiaryName = `${titleCase(b.first_name)} ${titleCase(b.last_name)}`;

  // discrepancies enriquecidas con el id del campo afectado (para saltar a él)
  const discrepancies = RESPONSE.discrepancies.map(d => {
    const target = fields.find(f => f.match && (
      (f.match.codes && f.match.codes.includes(d.document_code)) ||
      (f.match.fields && f.match.fields.includes(d.field_name))
    ));
    return { ...d, _fieldId: target ? target.id : null };
  });

  // validation_issues a nivel de sección → observaciones de sección
  const sectionIssues = [];
  const dd = RESPONSE.dossier_data;
  const pushIssues = (arr, group, section) => (arr || []).forEach(t => { if (t) sectionIssues.push({ text: t, group, section }); });
  pushIssues(dd.beneficiary.validation_issues,     'Beneficiario',         'Beneficiario');
  pushIssues(dd.related_adults.validation_issues,  'Apoderado',            'Adultos relacionados');
  pushIssues(dd.religion.validation_issues,        'Religión y permisos',  'Religión');
  pushIssues(dd.permissions.validation_issues,     'Religión y permisos',  'Permisos');

  function focusField(id) {
    setActiveId(id);
    const f = fields.find(x => x.id === id);
    if (f && f.group && f.group !== activeGroup) setActiveGroup(f.group);
    if (f && f.doc && f.doc !== activeDocId) {
      setActiveDocId(f.doc);
      setAutoSwitchHint(true);
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setAutoSwitchHint(false), 3500);
    }
  }

  function jumpToField(id) {
    const f = fields.find(x => x.id === id);
    if (f && f.group) setActiveGroup(f.group);
    focusField(id);
    setTimeout(() => { const el = fieldRefs.current[id]; if (el && el.querySelector) { const inp = el.querySelector('input'); if (inp) inp.focus(); } }, 60);
  }

  function handleChange(id, value) {
    setFields(fs => fs.map(f => {
      if (f.id !== id) return f;
      let status = f.status, error = f.error;
      const isDni = /(^dni_n$)|(_dni$)/.test(f.id);
      if (isDni) {
        const ok = /^\d{8}$/.test(value.replace(/\s/g, ''));
        status = ok ? 'ok' : 'error';
        error = ok ? null : 'El DNI debe tener 8 dígitos';
      } else if (f.type === 'bool') {
        status = (value === null || value === undefined) ? 'empty' : 'ok';
        error = null;
      } else if (f.type === 'multi') {
        const filled = Array.isArray(value) && value.length > 0;
        status = (filled || f.emptyOk) ? 'ok' : 'empty';
        error = null;
      } else if (f.discrepancy) {
        // al corregir un campo observado, se resuelve la discrepancia
        if (value && value !== f.value) { status = 'ok'; error = null; }
      } else {
        status = value ? 'ok' : 'empty';
        error = null;
      }
      return { ...f, value, status, error };
    }));
  }

  function selectDoc(id) {
    setActiveDocId(id);
    setAutoSwitchHint(false);
  }

  function jumpToGroup(g) { if (g) setActiveGroup(g); }

  // Agrupar campos
  const groups = ['Beneficiario', 'Educación', 'Salud', 'Religión y permisos', 'Padre', 'Madre', 'Apoderado'];
  const grouped = groups.map(g => {
    const items = fields.filter(f => f.group === g);
    const issues = items.filter(f => f.status === 'warning' || f.status === 'error').length
      + sectionIssues.filter(s => s.group === g).length;
    return { name: g, items, issues };
  });
  const activeItems = (grouped.find(g => g.name === activeGroup) || grouped[0]).items;

  return (
    <AppShell
      active={navActive}
      onNavigate={setNavActive}
      title="Triaje"
      subtitle="Corrección del expediente"
      user={{ name: 'Carmen Huamán', role: 'Operativo' }}
    >
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>
        <a href="TriajeLotes.html" style={{ color: CB_COLORS.primary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="inbox" size={12} color={CB_COLORS.primary} /> Triaje
        </a>
        <Icon name="chevron-right" size={11} color="#CBD5E1" />
        <a href="TriajeDetalleLote.html" style={{ color: CB_COLORS.primary, textDecoration: 'none' }}>Lote 12/05/2025</a>
        <Icon name="chevron-right" size={11} color="#CBD5E1" />
        <span style={{ color: CB_COLORS.textPrimary, fontWeight: 500 }}>{beneficiaryName}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 22, fontWeight: 700, color: CB_COLORS.textPrimary }}>
              {beneficiaryName}
            </div>
            <Badge type="warning" dot>Pendiente de revisión</Badge>
          </div>
          <div style={{ fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textMuted }}>
            DNI {b.dni} · Verifica los campos contra los documentos escaneados y resuelve las observaciones.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ width: 32, height: 32, borderRadius: 5, border: `1px solid ${CB_COLORS.border}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-left" size={14} color={CB_COLORS.textSecondary} />
          </button>
          <span style={{ fontFamily: "'Arimo', sans-serif", fontSize: 12, color: CB_COLORS.textMuted }}>Registro <strong style={{ color: CB_COLORS.textPrimary }}>2</strong> de 6</span>
          <button style={{ width: 32, height: 32, borderRadius: 5, border: `1px solid ${CB_COLORS.border}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-right" size={14} color={CB_COLORS.textSecondary} />
          </button>
        </div>
      </div>

      {/* Panel de validación */}
      <div style={{ marginBottom: 12 }}>
        <ValidationPanel fields={fields} status={RESPONSE.status} discrepancies={discrepancies} sectionIssues={sectionIssues} onJump={jumpToField} onJumpGroup={jumpToGroup} />
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: 14, height: 'calc(100vh - 400px)', minHeight: 440 }}>
        {/* LEFT */}
        <Card padding={12} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DocViewer activeDocId={activeDocId} onSelectDoc={selectDoc} autoSwitchHint={autoSwitchHint} />
        </Card>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          <Card padding={12} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontFamily: "'Alegreya Sans SC', serif", fontSize: 13.5, fontWeight: 600, color: CB_COLORS.textPrimary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="list-checks" size={14} color={CB_COLORS.primary} />
              Campos del expediente
              <span style={{ marginLeft: 'auto', fontFamily: "'Arimo', sans-serif", fontSize: 10.5, fontWeight: 400, color: CB_COLORS.textMuted }}>
                Click sobre un DNI para ver su documento
              </span>
            </div>

            {/* Group tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, flexShrink: 0 }}>
              {grouped.map(g => {
                const active = g.name === activeGroup;
                return (
                  <button key={g.name} onClick={() => setActiveGroup(g.name)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 11px', borderRadius: 999,
                    border: `1.5px solid ${active ? CB_COLORS.primary : CB_COLORS.border}`,
                    background: active ? CB_COLORS.primary : 'white',
                    fontFamily: "'Alegreya Sans', serif", fontSize: 12, fontWeight: 500,
                    color: active ? 'white' : CB_COLORS.textSecondary,
                    cursor: 'pointer', transition: 'all .12s', whiteSpace: 'nowrap',
                  }}>
                    {g.name}
                    {g.issues > 0 && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999,
                        background: active ? 'rgba(255,255,255,0.25)' : CB_COLORS.errorLight,
                        color: active ? 'white' : CB_COLORS.error,
                        fontFamily: "'Arimo', sans-serif", fontSize: 9.5, fontWeight: 700,
                      }}>{g.issues}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {activeItems.map(f => (
                <TCFieldRow
                  key={f.id}
                  field={f}
                  isActive={activeId === f.id}
                  onFocus={() => focusField(f.id)}
                  onChange={handleChange}
                  fieldRef={el => fieldRefs.current[f.id] = el}
                />
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a href="TriajeDetalleLote.html" style={{
              fontFamily: "'Alegreya Sans', serif", fontSize: 13, color: CB_COLORS.textSecondary,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name="arrow-left" size={13} color={CB_COLORS.textSecondary} />
              Volver al lote
            </a>
            <div style={{ display: 'flex', gap: 8 }}>
              <RechazarExpedienteButton returnHref="TriajeDetalleLote.html" />
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 6,
                border: `1.5px solid ${CB_COLORS.border}`, background: 'white',
                fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500,
                color: CB_COLORS.textSecondary, cursor: 'pointer',
              }}>
                Siguiente registro
                <Icon name="arrow-right" size={13} color={CB_COLORS.textSecondary} />
              </button>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 6, border: 'none',
                background: CB_COLORS.primary, color: 'white',
                fontFamily: "'Alegreya Sans', serif", fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
                <Icon name="save" size={13} color="white" />
                Guardar correcciones
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

Object.assign(window, { TriajeCorreccionScreen });
