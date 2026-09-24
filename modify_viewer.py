import re

viewer_file = 'src/features/triaje/components/case-doc-viewer.tsx'
with open(viewer_file, 'r', encoding='utf-8') as f:
    viewer_content = f.read()

# Add onReprocessDoc to Props
viewer_content = re.sub(
    r'onOpenReplaceModal\?\: \(code\: string, name\: string, skip_ocr\?\: boolean\) \=\> void;',
    r'onOpenReplaceModal?: (code: string, name: string, skip_ocr?: boolean) => void;\n  onReprocessDoc?: (code: string, name: string) => void;',
    viewer_content
)

# Add onReprocessDoc to destructuring
viewer_content = re.sub(
    r'onOpenReplaceModal,\n\}\: CaseDocViewerProps\) \{',
    r'onOpenReplaceModal,\n  onReprocessDoc,\n}: CaseDocViewerProps) {',
    viewer_content
)

# Remove DropdownMenu and add buttons next to Ajustar
dropdown_regex = re.compile(r'\{onOpenReplaceModal && \(\s*<DropdownMenu>.*?</DropdownMenu>\s*\)\}', re.DOTALL)
viewer_content = dropdown_regex.sub('', viewer_content)

buttons_to_add = '''
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => setZoom(1)}
          >
            Ajustar
          </Button>
          {onOpenReplaceModal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 border-primary/20 text-primary hover:bg-brand-50 font-medium"
              onClick={() => onOpenReplaceModal(activeDoc?.code ?? 'DESCONOCIDO', activeDoc?.file_name ?? 'Documento', true)}
              title="Cambiar imagen manualmente conservando datos"
            >
              <ImagePlus className="mr-1.5 size-3.5" />
              Editar Imagen
            </Button>
          )}
          {onReprocessDoc && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-7 text-xs bg-primary hover:bg-primary/90 text-white shadow-sm"
              onClick={() => onReprocessDoc(activeDoc?.code ?? 'DESCONOCIDO', activeDoc?.file_name ?? 'Documento')}
              title="Vuelve a leer el documento actual usando la Inteligencia Artificial"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Reprocesar IA
            </Button>
          )}
'''

viewer_content = re.sub(
    r'<Button\s+type="button"\s+variant="outline"\s+size="sm"\s+className="h-7"\s+onClick=\{\(\) \=\> setZoom\(1\)\}\s+>\s+Ajustar\s+</Button>',
    buttons_to_add,
    viewer_content
)

with open(viewer_file, 'w', encoding='utf-8') as f:
    f.write(viewer_content)
