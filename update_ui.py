import re

# 1. Remove Reprocesar IA from case-doc-viewer
viewer_file = 'src/features/triaje/components/case-doc-viewer.tsx'
with open(viewer_file, 'r', encoding='utf-8') as f:
    v_content = f.read()
v_content = re.sub(
    r'\{onReprocessDoc && \(\s*<Button\s+type="button"\s+variant="default".*?Reprocesar IA\s*</Button>\s*\)\}',
    '',
    v_content,
    flags=re.DOTALL
)
with open(viewer_file, 'w', encoding='utf-8') as f:
    f.write(v_content)

# 2. Update case-correction-actions.tsx
actions_file = 'src/features/triaje/components/case-correction-actions.tsx'
with open(actions_file, 'r', encoding='utf-8') as f:
    a_content = f.read()

# Add onReprocess prop
a_content = a_content.replace(
    'onNext: () => void;',
    'onNext: () => void;\n  onReprocess: () => void;'
)
a_content = a_content.replace(
    'canEdit: boolean;\n}',
    'canEdit: boolean;\n  isReprocessing?: boolean;\n}'
)
a_content = a_content.replace(
    'canEdit,\n}: CaseCorrectionActionsProps)',
    'canEdit,\n  onReprocess,\n  isReprocessing,\n}: CaseCorrectionActionsProps)'
)

# Add Reprocesar Expediente button next to Rechazar
reprocess_btn = '''
        <Button
          variant="outline"
          className="border-primary/20 text-primary hover:bg-brand-50"
          onClick={onReprocess}
          disabled={isSubmitting || isReprocessing}
        >
          {isReprocessing ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
          Reprocesar Expediente (IA)
        </Button>
'''
a_content = a_content.replace(
    '<XCircle />\n          Rechazar expediente\n        </Button>',
    '<XCircle />\n          Rechazar expediente\n        </Button>' + reprocess_btn
)

with open(actions_file, 'w', encoding='utf-8') as f:
    f.write(a_content)

# 3. Create hook use-reprocess-dossier.ts
hook_file = 'src/features/triaje/hooks/use-reprocess-dossier.ts'
hook_content = """'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { triajeKeys, invalidateBatchState } from './use-triaje-queries';
import { apiClient } from '@/lib/api-client';
import { API_PATHS } from '@/lib/api-paths';

export function useReprocessDossier(batchId: string, caseDni: string, caseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`${API_PATHS.batches}/${batchId}/dossiers/${caseDni}/reprocess`);
      return res;
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Error al reprocesar el expediente');
    },
    onSuccess: () => {
      Promise.all([
        invalidateBatchState(queryClient, batchId),
        queryClient.invalidateQueries({ queryKey: triajeKeys.caseDocuments(batchId, caseDni) }),
        queryClient.invalidateQueries({ queryKey: triajeKeys.case(caseId) }),
      ]);
    },
  });
}
"""
with open(hook_file, 'w', encoding='utf-8') as f:
    f.write(hook_content)

# 4. Update case-correction-screen.tsx
screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

s_content = s_content.replace(
    "import { useUploadMissingDoc } from '../hooks/use-upload-missing-doc';",
    "import { useUploadMissingDoc } from '../hooks/use-upload-missing-doc';\nimport { useReprocessDossier } from '../hooks/use-reprocess-dossier';"
)

s_content = s_content.replace(
    "const uploadMutation = useUploadMissingDoc(batchId, dniReference, caseId);",
    "const uploadMutation = useUploadMissingDoc(batchId, dniReference, caseId);\n  const reprocessMutation = useReprocessDossier(batchId, dniReference, caseId);"
)

# Remove onReprocessDoc from CaseDocViewer
s_content = re.sub(
    r'onReprocessDoc=\{\(code, name\) => \{.*?\n\s*\}\}',
    '',
    s_content,
    flags=re.DOTALL
)

# Pass onReprocess to CaseCorrectionActions
s_content = s_content.replace(
    'canReject={vm.status !== \'REJECTED\'}',
    '''canReject={vm.status !== 'REJECTED'}
              onReprocess={() => {
                reprocessMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success('El expediente completo se envi a reprocesar. Cargando...');
                    void vm.refetchCase();
                  }
                });
              }}
              isReprocessing={reprocessMutation.isPending}'''
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)

