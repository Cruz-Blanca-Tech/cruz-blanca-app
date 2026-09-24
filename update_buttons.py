import re

# 1. Update CaseCorrectionActions
actions_file = 'src/features/triaje/components/case-correction-actions.tsx'
with open(actions_file, 'r', encoding='utf-8') as f:
    a_content = f.read()

# Remove the Reprocesar Expediente button
a_content = re.sub(
    r'<Button\s*variant="outline"\s*className="border-primary/20 text-primary hover:bg-brand-50"\s*onClick=\{onReprocess\}[^>]*>\s*\{isReprocessing \? <Loader2 className="mr-1\.5 size-4 animate-spin" /> : null\}\s*Reprocesar Expediente \(IA\)\s*</Button>',
    '',
    a_content
)

# Rename Guardar and make it green
a_content = re.sub(
    r'<Button\s*onClick=\{onSubmit\}\s*disabled=\{isSubmitting \|\| isIncomplete \|\| !canEdit\}\s*>',
    '<Button\n          onClick={onSubmit}\n          disabled={isSubmitting || isIncomplete || !canEdit}\n          className="bg-emerald-600 hover:bg-emerald-700 text-white"\n        >',
    a_content
)
a_content = a_content.replace('Guardar correcciones', 'Validar correcciones')

with open(actions_file, 'w', encoding='utf-8') as f:
    f.write(a_content)

# 2. Update CaseCorrectionScreen
screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

# Remove onReprocess from CaseCorrectionActions
s_content = re.sub(
    r'onReprocess=\{\(\) => \{.*?\n\s*\}\}\n\s*isReprocessing=\{reprocessMutation\.isPending\}',
    '',
    s_content,
    flags=re.DOTALL
)

# Add onReprocessDoc to CaseDocViewer
s_content = s_content.replace(
    'onOpenReplaceModal={(code, name, skipOcr) => vm.setReplaceDocTarget({ code, name, skipOcr })}',
    '''onOpenReplaceModal={(code, name, skipOcr) => vm.setReplaceDocTarget({ code, name, skipOcr })}
              onReprocessDoc={() => {
                reprocessMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success('El expediente completo se envió a reprocesar. Cargando...');
                    void vm.refetchCase();
                  }
                });
              }}
              isReprocessing={reprocessMutation.isPending}'''
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)


# 3. Update CaseDocViewer
viewer_file = 'src/features/triaje/components/case-doc-viewer.tsx'
with open(viewer_file, 'r', encoding='utf-8') as f:
    v_content = f.read()

# Add onReprocessDoc and isReprocessing to props
v_content = v_content.replace(
    'onOpenReplaceModal?: (code: string, name: string, skip_ocr?: boolean) => void;',
    'onOpenReplaceModal?: (code: string, name: string, skip_ocr?: boolean) => void;\n  onReprocessDoc?: () => void;\n  isReprocessing?: boolean;'
)
v_content = v_content.replace(
    'onOpenReplaceModal,\n}: CaseDocViewerProps) {',
    'onOpenReplaceModal,\n  onReprocessDoc,\n  isReprocessing,\n}: CaseDocViewerProps) {'
)

# Render Reprocess button next to Editar Imagen
reprocess_btn = '''
          {onReprocessDoc && (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isReprocessing}
              className="h-7 text-xs bg-primary hover:bg-primary/90 text-white shadow-sm"
              onClick={onReprocessDoc}
              title="Vuelve a leer TODOS los documentos de este expediente usando Inteligencia Artificial"
            >
              {isReprocessing ? <RefreshCw className="mr-1.5 size-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 size-3.5" />}
              Reprocesar IA
            </Button>
          )}
'''

v_content = re.sub(
    r'(<ImagePlus className="mr-1\.5 size-3\.5" />\s*Editar Imagen\s*</Button>\s*\)\})',
    r'\1' + reprocess_btn,
    v_content
)

# Add Loader2 import if needed
if 'Loader2' not in v_content:
    v_content = v_content.replace('RefreshCw,', 'RefreshCw,\n  Loader2,')

with open(viewer_file, 'w', encoding='utf-8') as f:
    f.write(v_content)

