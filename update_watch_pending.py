import re

hook_file = 'src/features/triaje/hooks/use-case-correction.ts'
with open(hook_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

# We need to import useEffect and useRef if they aren't there.
# Let's just find the imports.
if 'useEffect' not in s_content:
    s_content = s_content.replace("import { useMemo, useState } from 'react';", "import { useMemo, useState, useEffect, useRef } from 'react';")
else:
    if 'useRef' not in s_content:
        s_content = s_content.replace("useEffect", "useEffect, useRef")

# We need to add logic to watch pendingDocuments
watch_logic = '''
  const previousPendingRef = useRef(pendingDocuments.length);
  useEffect(() => {
    // If pending documents dropped to 0 (meaning async OCR finished), refetch the Triage Case to get the new data
    if (previousPendingRef.current > 0 && pendingDocuments.length === 0) {
      caseQuery.refetch();
    }
    previousPendingRef.current = pendingDocuments.length;
  }, [pendingDocuments.length, caseQuery]);
'''

# Find a place to insert it. Just before `const isIncomplete =`
s_content = s_content.replace(
    'const isIncomplete =',
    watch_logic.strip() + '\n\n  const isIncomplete ='
)

with open(hook_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
