import re

screen_file = 'src/features/triaje/components/case-correction-screen.tsx'
with open(screen_file, 'r', encoding='utf-8') as f:
    s_content = f.read()

s_content = s_content.replace(
    "toast.success('El expediente completo se envió a reprocesar. Cargando...');",
    "toast.success('Expediente reprocesado exitosamente con Inteligencia Artificial.');"
)

# Might have some encoding weirdness in the terminal output, let's also try a regex just in case
s_content = re.sub(
    r"toast\.success\('El expediente completo se envi[^']+ a reprocesar\. Cargando\.\.\.'\);",
    "toast.success('Expediente reprocesado exitosamente con Inteligencia Artificial.');",
    s_content
)

with open(screen_file, 'w', encoding='utf-8') as f:
    f.write(s_content)
