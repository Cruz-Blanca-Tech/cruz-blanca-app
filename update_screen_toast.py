import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

replacement = '''
              <CaseCorrectionActions
                caseId={caseId}
                canSave={caseActions.canSave}
                canReject={caseActions.canReject}
                onReprocess={() => {
                  reprocessMutation.mutate(undefined, {
                    onSuccess: (res) => {
                      if (res && res.message && res.message.includes("fallaron")) {
                        toast.error(res.message);
                      } else {
                        toast.success(res?.message || 'Expediente reprocesado exitosamente con Inteligencia Artificial.');
                      }
                      void vm.refetchCase();
                    }
                  });
                }}
                onSave={() => submitCorrection.mutate({ action: 'APPROVE', data: vm.form.getValues() })}
                onReject={() => setRejectOpen(true)}
              />
'''

s_content = re.sub(
    r'<CaseCorrectionActions\s+caseId=\{caseId\}\s+canSave=\{caseActions\.canSave\}\s+canReject=\{caseActions\.canReject\}\s+onReprocess=\{\(\) => \{\s*reprocessMutation\.mutate\(undefined, \{\s*onSuccess: \(\) => \{\s*toast\.success\(\'Expediente reprocesado exitosamente con Inteligencia Artificial\.\'\);\s*void vm\.refetchCase\(\);\s*\}\s*\}\);\s*\}\}\s+onSave=\{\(\) => submitCorrection\.mutate\(\{ action: \'APPROVE\', data: vm\.form\.getValues\(\) \}\)\}\s+onReject=\{\(\) => setRejectOpen\(true\)\}\s+/>',
    replacement.strip(),
    s_content
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
