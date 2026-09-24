import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

replacement = '''
                  reprocessMutation.mutate(undefined, {
                    onSuccess: (res: any) => {
                      if (res && res.message && res.message.includes("fallaron")) {
                        toast.error(res.message);
                      } else {
                        toast.success(res?.message || 'Expediente reprocesado exitosamente con Inteligencia Artificial.');
                      }
                      void vm.refetchCase();
                    }
                  });
'''

s_content = re.sub(
    r'reprocessMutation\.mutate\(undefined, \{\s*onSuccess: \(\) => \{\s*toast\.success\(\'Expediente reprocesado exitosamente con Inteligencia Artificial\.\'\);\s*void vm\.refetchCase\(\);\s*\}\s*\}\);',
    replacement.strip(),
    s_content
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
