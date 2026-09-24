import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

# Make sure Loader2 is imported
if 'Loader2' not in s_content:
    s_content = s_content.replace(
        "import { ArrowLeft, ArrowRight, CheckCircle2, Lock, XCircle } from 'lucide-react';",
        "import { ArrowLeft, ArrowRight, CheckCircle2, Lock, XCircle, Loader2 } from 'lucide-react';"
    )

# Compute isReprocessing and canEditForm
insert_logic = '''
  const isApproved = vm.caseData?.status === 'APPROVED';
  const isRejected = vm.caseData?.status === 'REJECTED';
  const isSyncFailed = vm.caseData?.sync_status === 'FAILED';
  
  const isReprocessing = reprocessMutation.isPending;
  const canEditForm = caseActions.canEdit && !isReprocessing;
  const displayLockReason = isReprocessing 
    ? 'Reprocesando expediente con Inteligencia Artificial. Por favor, espere unos segundos...'
    : caseActions.lockReason;
'''
s_content = re.sub(
    r'const isApproved = vm\.caseData\?\.status === \'APPROVED\';\s*const isRejected = vm\.caseData\?\.status === \'REJECTED\';\s*const isSyncFailed = vm\.caseData\?\.status === \'FAILED\';',
    insert_logic.strip(),
    s_content
)
# Wait, let's just do a simpler replace.
s_content = s_content.replace(
    'const isSyncFailed = vm.caseData?.sync_status === \'FAILED\';',
    "const isSyncFailed = vm.caseData?.sync_status === 'FAILED';\n  const isReprocessing = reprocessMutation.isPending;\n  const canEditForm = caseActions.canEdit && !isReprocessing;\n  const displayLockReason = isReprocessing ? 'Reprocesando expediente con Inteligencia Artificial. Por favor, espere unos segundos...' : caseActions.lockReason;"
)

# Update the Lock message block
lock_block_old = '''
                {caseActions.lockReason && (
                  <div className="mb-2.5 flex shrink-0 items-start gap-2 rounded-md bg-info-light px-3 py-2">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-info-dark" />
                    <p className="font-sans text-[12.5px] text-info-dark">
                      {caseActions.lockReason}
                    </p>
                  </div>
                )}
'''
lock_block_new = '''
                {displayLockReason && (
                  <div className="mb-2.5 flex shrink-0 items-start gap-2 rounded-md bg-info-light px-3 py-2">
                    {isReprocessing ? (
                      <Loader2 className="mt-0.5 size-3.5 shrink-0 text-info-dark animate-spin" />
                    ) : (
                      <Lock className="mt-0.5 size-3.5 shrink-0 text-info-dark" />
                    )}
                    <p className="font-sans text-[12.5px] text-info-dark">
                      {displayLockReason}
                    </p>
                  </div>
                )}
'''
# Actually let's use regex
s_content = re.sub(
    r'\{caseActions\.lockReason && \(\s*<div className="mb-2\.5 flex shrink-0 items-start gap-2 rounded-md bg-info-light px-3 py-2">\s*<Lock className="mt-0\.5 size-3\.5 shrink-0 text-info-dark" />\s*<p className="font-sans text-\[12\.5px\] text-info-dark">\s*\{caseActions\.lockReason\}\s*</p>\s*</div>\s*\)\}',
    lock_block_new.strip(),
    s_content
)

# Update fieldset disabled
s_content = s_content.replace(
    '<fieldset disabled={!caseActions.canEdit} className="contents">',
    '<fieldset disabled={!canEditForm} className="contents">'
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
