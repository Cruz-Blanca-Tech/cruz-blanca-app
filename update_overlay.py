import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

# Add a full overlay to CaseCorrectionScreen when isReprocessing is true
overlay_jsx = '''
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

# Find a good place to insert it. Right inside the root return div.
# <div className="flex flex-1 flex-col gap-3 p-6">
s_content = s_content.replace(
    '<div className="flex flex-1 flex-col gap-3 p-6">',
    '<div className="flex flex-1 flex-col gap-3 p-6">' + overlay_jsx
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
