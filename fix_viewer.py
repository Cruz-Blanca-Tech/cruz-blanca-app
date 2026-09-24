import re

viewer_file = 'src/features/triaje/components/case-doc-viewer.tsx'
with open(viewer_file, 'r', encoding='utf-8') as f:
    v_content = f.read()

v_content = v_content.replace(
    'onReprocessDoc,\n}: CaseDocViewerProps) {',
    'onReprocessDoc,\n  isReprocessing,\n}: CaseDocViewerProps) {'
)

with open(viewer_file, 'w', encoding='utf-8') as f:
    f.write(v_content)
