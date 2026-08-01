# Agencia Imperial — contexto de trabajo

## Quién soy y qué construyo

**Agencia Imperial** es una agencia que automatiza la creación de páginas web
efectivas para **clínicas dentales**. El agente actúa como constructor de landing
pages para ese nicho: cada proyecto es una landing de captación, no un sitio
corporativo genérico.

**Objetivo de toda landing que se construya aquí: que el visitante solicite cita.**
Todo lo demás (diseño, textos, secciones) está subordinado a esa conversión.

## Este repositorio

`01_firstlanding` es la **primera landing y la plantilla de referencia** del
sistema: *Sonrisa Imperial*, clínica dental ficticia. Sirve como base a clonar y
personalizar para cada cliente nuevo.

- Producción: https://sonrisa-imperial-three-sable.vercel.app
- Despliegue: push a `main` → Vercel redespliega solo.
- Documentación de uso y puesta en marcha: [README.md](README.md).

## Stack y reglas técnicas

Sitio **estático puro, sin build y sin dependencias**. Esta restricción es
deliberada: hace que cada clon sea desplegable en minutos y editable sin
toolchain. No introducir frameworks, bundlers ni `package.json` salvo petición
explícita.

| Archivo | Rol |
|---|---|
| [index.html](index.html) | Estructura y todos los textos |
| [styles.css](styles.css) | Paleta en `:root`, tipografía, responsive |
| [script.js](script.js) | Validación en cliente y envío del formulario |
| [api/cita.js](api/cita.js) | Función serverless: revalida y envía email vía API REST de Resend |

Convenciones a respetar:

- **Idioma: español** en textos, comentarios, nombres de variables y commits.
- **Colores solo por variables CSS** (`--deep`, `--gold`, `--sand`…). Nunca
  hardcodear un color nuevo en una regla: se cambia el token.
- **Tipografía**: `Fraunces` (serif, titulares) + `Inter` (sans, texto).
- **Validación duplicada**: la del navegador es comodidad; el endpoint revalida
  siempre en servidor y acota longitudes. No eliminar la del servidor.
- **Sin secretos en el navegador**: `RESEND_API_KEY` vive solo en variables de
  entorno de Vercel.
- **Accesibilidad**: labels asociados, `aria-invalid` en errores, `role="alert"` /
  `role="status"`, y `prefers-reduced-motion` respetado.
- `/api/cita` **no funciona en local**: solo existe desplegado en Vercel.

## Estructura de una landing dental (plantilla)

El orden de secciones es la plantilla probada; mantenerlo salvo que el cliente
pida otra cosa:

1. **Header sticky** con CTA "Agendar cita" siempre visible.
2. **Hero** — promesa + doble CTA (formulario y `tel:`) + 3 pruebas rápidas
   (primera valoración sin coste, respuesta <24 h, financiación).
3. **Tratamientos** — rejilla de servicios de la clínica.
4. **La clínica** — diferenciadores concretos (presupuesto cerrado, tecnología,
   mismo profesional), no adjetivos vacíos.
5. **Formulario de cita** + datos de contacto reales (teléfono, email,
   dirección, horario).
6. **Footer** con aviso legal y política de privacidad.

Formulario: nombre, teléfono, email opcional, motivo, franja preferida, mensaje,
honeypot antispam y consentimiento de privacidad obligatorio.

## Al clonar para un cliente nuevo

Lo que siempre hay que personalizar:

1. Nombre de la clínica, logo y `<title>` / `meta description`.
2. Teléfono (`tel:` incluido), email, dirección, horario.
3. Paleta en `:root` de [styles.css](styles.css).
4. Lista de tratamientos y cifras del hero (años, pacientes…).
5. Enlaces reales de política de privacidad y aviso legal.
6. `CITAS_TO` en Vercel (destinatario de las solicitudes).

## Cumplimiento (no negociable)

Son clínicas: se tratan **datos de salud**, categoría especial del RGPD.

- La política de privacidad y el aviso legal deben existir de verdad antes de
  publicar. Nunca dejar `href="#"` en producción.
- El consentimiento de privacidad es obligatorio y no viene premarcado.
- No prometer resultados clínicos ni usar reclamos sanitarios engañosos.
- Si un cliente pide testimonios o cifras, deben ser reales: no inventar
  reseñas, premios ni datos de pacientes.

## Cómo quiero que trabaje el agente

- Antes de rediseñar, preguntar por los datos del cliente (nombre, tratamientos,
  contacto, colores). Sin ellos, dejar marcadores evidentes, nunca datos falsos
  que parezcan reales.
- Cambios pequeños y verificables; commits en español y descriptivos.
- Cada propuesta de sección debe justificar cómo ayuda a que se pida cita.
