import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

s_content = s_content.replace(
    '(isReprocessing || pendingDocuments.length > 0)',
    '(isReprocessing || vm.pendingDocuments.length > 0)'
)
s_content = s_content.replace(
    'pendingDocuments.length > 0 ?',
    'vm.pendingDocuments.length > 0 ?'
)
s_content = s_content.replace(
    '${pendingDocuments.length}',
    '${vm.pendingDocuments.length}'
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
