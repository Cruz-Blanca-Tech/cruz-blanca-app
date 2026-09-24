import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

# Make the container relative
s_content = s_content.replace(
    '<div className="flex flex-1 flex-col gap-3 p-6">',
    '<div className="relative flex flex-1 flex-col gap-3 p-6">'
)

# Update the overlay to use pendingDocuments and be absolute instead of fixed
old_overlay = '''
      {/* Overlay de Carga (IA Reprocesando) */}
      {isReprocessing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-2xl">
            <Loader2 className="size-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-ink-primary">
                El expediente se está procesando por la IA
              </h3>
              <p className="mt-1 text-sm text-ink-secondary">
                Esto tomará unos segundos. Por favor, no cierre esta ventana.
              </p>
            </div>
          </div>
        </div>
      )}
'''

new_overlay = '''
      {/* Overlay de Carga (IA Reprocesando) local al área de trabajo */}
      {(isReprocessing || pendingDocuments.length > 0) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-2xl">
            <Loader2 className="size-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-ink-primary">
                El expediente se está procesando por la IA
              </h3>
              <p className="mt-1 text-sm text-ink-secondary">
                {pendingDocuments.length > 0 ? `Analizando ${pendingDocuments.length} documento(s) en progreso...` : 'Enviando solicitud a la IA. Por favor espere...'}
              </p>
            </div>
          </div>
        </div>
      )}
'''

# Use regex to replace the old overlay
s_content = re.sub(
    r'\{\/\* Overlay de Carga \(IA Reprocesando\) \*\/\}\s*\{isReprocessing && \(\s*<div className="fixed inset-0 z-\[9999\] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">\s*<div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-2xl">\s*<Loader2 className="size-12 animate-spin text-primary" />\s*<div className="text-center">\s*<h3 className="font-heading text-lg font-bold text-ink-primary">\s*El expediente se est[^ ]* procesando por la IA\s*</h3>\s*<p className="mt-1 text-sm text-ink-secondary">\s*Esto tomar[^ ]* unos segundos\. Por favor, no cierre esta ventana\.\s*</p>\s*</div>\s*</div>\s*</div>\s*\)\}',
    new_overlay.strip(),
    s_content
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
