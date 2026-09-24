import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

# Add useReprocessDossier import if not present
if 'useReprocessDossier' not in s_content:
    s_content = s_content.replace(
        "import { useRetryCaseSync } from '../hooks/use-retry-case-sync';",
        "import { useRetryCaseSync } from '../hooks/use-retry-case-sync';\nimport { useReprocessDossier } from '../hooks/use-reprocess-dossier';"
    )

# Insert hook initialization
s_content = s_content.replace(
    'const retryCaseSync = useRetryCaseSync(caseId, batchId);',
    'const retryCaseSync = useRetryCaseSync(caseId, batchId);\n  const reprocessMutation = useReprocessDossier(batchId, dniReference, caseId);'
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
