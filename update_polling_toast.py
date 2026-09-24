import re

hook_file = 'src/features/triaje/hooks/use-case-correction.ts'
with open(hook_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

if "import { toast } from 'sonner';" not in s_content:
    s_content = "import { toast } from 'sonner';\n" + s_content

watch_logic_old = '''
    if (previousPendingRef.current > 0 && pendingDocuments.length === 0) {
      caseQuery.refetch();
    }
'''

watch_logic_new = '''
    if (previousPendingRef.current > 0 && pendingDocuments.length === 0) {
      caseQuery.refetch();
      // Notificar al usuario que la IA terminó
      toast.success('¡El reprocesamiento con IA ha finalizado!');
    }
'''

s_content = s_content.replace(watch_logic_old.strip(), watch_logic_new.strip())

with open(hook_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
