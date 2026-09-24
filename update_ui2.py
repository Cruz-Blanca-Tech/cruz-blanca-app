import re

# 1. Update CaseDocViewer: Remove Reprocess button and props
viewer_file = 'src/features/triaje/components/case-doc-viewer.tsx'
with open(viewer_file, 'r', encoding='utf-8') as f:
    v_content = f.read()

v_content = v_content.replace('\n  onReprocessDoc,\n  isReprocessing,', '')
v_content = v_content.replace('\n  onReprocessDoc?: () => void;\n  isReprocessing?: boolean;', '')

# Remove the button block
v_content = re.sub(
    r'\{onReprocessDoc && \(\s*<Button\s+type="button"\s+variant="default"\s+size="sm"\s+disabled=\{isReprocessing\}[^>]+>\s*\{isReprocessing \? <RefreshCw className="mr-1\.5 size-3\.5 animate-spin" /> : <RefreshCw className="mr-1\.5 size-3\.5" />\}\s*Reprocesar IA\s*</Button>\s*\)\}',
    '',
    v_content,
    flags=re.DOTALL
)
with open(viewer_file, 'w', encoding='utf-8') as f:
    f.write(v_content)


# 2. Update CaseCorrectionActions: Add Reprocess to the left, Change Save to Check
actions_file = 'src/features/triaje/components/case-correction-actions.tsx'
with open(actions_file, 'r', encoding='utf-8') as f:
    a_content = f.read()

# Make sure imports are there (Check, RefreshCw)
if 'RefreshCw' not in a_content:
    a_content = a_content.replace("import { ArrowLeft, ArrowRight, Loader2, Save, XCircle } from 'lucide-react';", "import { ArrowLeft, ArrowRight, Loader2, Save, XCircle, RefreshCw, Check } from 'lucide-react';")

# Re-add props
if 'onReprocess:' not in a_content:
    a_content = a_content.replace('onNext: () => void;', 'onNext: () => void;\n  onReprocess: () => void;')
if 'isReprocessing?:' not in a_content:
    a_content = a_content.replace('canEdit: boolean;\n}', 'canEdit: boolean;\n  isReprocessing?: boolean;\n}')
if 'onReprocess,' not in a_content:
    a_content = a_content.replace('canEdit,\n}:', 'canEdit,\n  onReprocess,\n  isReprocessing,\n}:')

# Group "Volver al lote" and "Reprocesar"
left_group = '''<div className="flex items-center gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-sans text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft className="size-3.5" />
        Volver al lote
      </button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 border-primary/20 text-primary hover:bg-brand-50"
        onClick={onReprocess}
        disabled={isSubmitting || isReprocessing}
      >
        {isReprocessing ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 size-3.5" />}
        Reprocesar Expediente (IA)
      </Button>
    </div>'''

a_content = re.sub(
    r'<button\s*type="button"\s*onClick=\{onBack\}[^>]*>\s*<ArrowLeft className="size-3\.5" />\s*Volver al lote\s*</button>',
    left_group,
    a_content
)

# Change <Save /> to <Check />
a_content = a_content.replace('<Save />', '<Check />')

with open(actions_file, 'w', encoding='utf-8') as f:
    f.write(a_content)


# 3. Update CaseCorrectionScreen: Move prop from Viewer to Actions
screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

# Remove from viewer
s_content = re.sub(
    r'onReprocessDoc=\{\(\) => \{.*?\n\s*\}\}\n\s*isReprocessing=\{reprocessMutation\.isPending\}',
    '',
    s_content,
    flags=re.DOTALL
)

# Add to Actions
if 'onReprocess={' not in s_content:
    s_content = s_content.replace(
        'canReject={caseActions.canReject}',
        '''canReject={caseActions.canReject}
              onReprocess={() => {
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
