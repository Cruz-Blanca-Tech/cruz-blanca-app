export const commonDiseases = [
  'Asma',
  'Diabetes Tipo 1',
  'Diabetes Tipo 2',
  'Hipertensión',
  'Epilepsia',
  'Tuberculosis',
  'Anemia',
  'Desnutrición',
  'Obesidad',
  'VIH/SIDA',
  'Alergia severa',
  'Enfermedad cardíaca congénita',
  'Autismo',
  'TDAH',
  'Síndrome de Down',
].map((v) => ({ label: v, value: v }));

export const commonVaccines = [
  'BCG (Tuberculosis)',
  'Hepatitis B',
  'Pentavalente',
  'Polio (IPV/OPV)',
  'Rotavirus',
  'Neumococo',
  'Influenza',
  'SPR (Sarampión, Paperas, Rubéola)',
  'Varicela',
  'Fiebre Amarilla',
  'DPT (Difteria, Tétanos, Tos ferina)',
  'VPH (Papiloma Humano)',
  'COVID-19',
].map((v) => ({ label: v, value: v }));

export const commonAllergies = [
  'Penicilina',
  'Ibuprofeno',
  'Aspirina',
  'Maní',
  'Lácteos',
  'Huevo',
  'Mariscos',
  'Polvo',
  'Polen',
  'Picaduras de insectos',
  'Pelo de animales',
].map((v) => ({ label: v, value: v }));

export const commonMedications = [
  'Paracetamol',
  'Ibuprofeno',
  'Amoxicilina',
  'Azitromicina',
  'Salbutamol',
  'Cetirizina',
  'Loratadina',
  'Prednisona',
  'Insulina',
].map((v) => ({ label: v, value: v }));

export const commonInsurances = [
  'SIS (Seguro Integral de Salud)',
  'EsSalud',
  'EPS Pacífico',
  'EPS Rimac',
  'EPS Mapfre',
  'EPS Sanitas',
  'Particular',
].map((v) => ({ label: v, value: v }));
