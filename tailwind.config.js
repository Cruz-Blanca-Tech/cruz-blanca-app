/**
 * Cruz Blanca — Tailwind CSS v4 JS config (documentación/referencia).
 *
 * IMPORTANTE — Tailwind v4 NO carga este archivo automáticamente.
 * Para activarlo agregar en globals.css:  @config "../../tailwind.config.js";
 *
 * Estado actual: todos los tokens (colores, fuentes, radios, sombras,
 * tamaños de texto) están definidos en globals.css bajo @theme inline.
 * Este archivo sirve de referencia y puede activarse si se necesitan
 * los overrides de spacing o plugins de terceros en el futuro.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontSize: {
        xs:   '11px',
        sm:   '13px',
        base: '15px',
        md:   '16px',
        lg:   '18px',
        xl:   '20px',
        '2xl':'24px',
        '3xl':'30px',
        '4xl':'36px',
      },

      spacing: {
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        8:  '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },

      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },

      boxShadow: {
        card:     'var(--shadow-card)',
        dropdown: 'var(--shadow-dropdown)',
        modal:    'var(--shadow-modal)',
        sidebar:  'var(--shadow-sidebar)',
      },
    },
  },
  plugins: [],
};
