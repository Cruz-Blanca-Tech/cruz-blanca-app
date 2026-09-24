import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    screen_content = f.read()

# Add useUploadMissingDoc import if not present
if 'useUploadMissingDoc' not in screen_content:
    screen_content = screen_content.replace(
        "import { UploadMissingDocModal } from './upload-missing-doc-modal';",
        "import { UploadMissingDocModal } from './upload-missing-doc-modal';\nimport { useUploadMissingDoc } from '../hooks/use-upload-missing-doc';"
    )

# Hook instantiation inside component
hook_instantiation = '''
  const isSyncing = syncMutation.isPending;
  const uploadMutation = useUploadMissingDoc(batchId, dniReference, caseId);
'''
screen_content = screen_content.replace('const isSyncing = syncMutation.isPending;', hook_instantiation)

# Add onReprocessDoc to CaseDocViewer
reprocess_prop = '''
              onOpenReplaceModal={(code, name, skipOcr) => vm.setReplaceDocTarget({ code, name, skipOcr })}
              onReprocessDoc={(code, name) => {
                const doc = vm.documents.find((d) => d.code === code);
                if (!doc || !doc.source_id) {
                  toast.error('No se puede reprocesar: falta el archivo original.');
                  return;
                }
                uploadMutation.mutate(
                  {
                    document_code: code,
                    skip_ocr: false,
                    file: { file_name: name, source_id: doc.source_id },
                  },
                  {
                    onSuccess: () => {
                      toast.success('El documento se envi a reprocesar con IA.');
                      void vm.refetchCase();
                    },
                  }
                );
              }}
'''
screen_content = screen_content.replace(
    'onOpenReplaceModal={(code, name, skipOcr) => vm.setReplaceDocTarget({ code, name, skipOcr })}',
    reprocess_prop
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(screen_content)
