import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

replacement = '''
                onReprocess={() => {
                  reprocessMutation.mutate(undefined, {
                      onSuccess: () => {
                        // El toast de éxito real se muestra ahora cuando el polling termina
                        void vm.refetchCase();
                      }
                    });
                }}
'''

s_content = re.sub(
    r'onReprocess=\{\(\) => \{\s*reprocessMutation\.mutate\(undefined, \{\s*onSuccess: \(res: any\) => \{\s*if \(res && res\.message && res\.message\.includes\("fallaron"\)\) \{\s*toast\.error\(res\.message\);\s*\} else \{\s*toast\.success\(res\?\.message \|\| \'Expediente reprocesado exitosamente con Inteligencia Artificial\.\'\);\s*\}\s*void vm\.refetchCase\(\);\s*\}\s*\}\);\s*\}\}',
    replacement.strip(),
    s_content
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
