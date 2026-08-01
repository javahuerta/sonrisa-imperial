# Sonrisa Imperial — Landing page

Landing de una sola página para una clínica dental. Objetivo único: que el
visitante solicite una cita.

**En producción:** https://sonrisa-imperial-three-sable.vercel.app
(desplegado desde `main`; cada push redespliega automáticamente)

## Archivos

- `index.html` — estructura y contenido
- `styles.css` — estilos (paleta, tipografía, responsive)
- `script.js` — validación y envío del formulario

Se abre directamente con doble clic en `index.html`, sin build ni dependencias.
Para servirla en local:

```bash
python3 -m http.server 4173
```

## Qué hay que personalizar

| Dónde | Qué cambiar |
|---|---|
| `index.html` | Teléfono (`+34600123456`), email, dirección y horario |
| `index.html` | Textos de tratamientos y el dato "15 años" del hero |
| `index.html` | Enlaces de política de privacidad y aviso legal |
| `styles.css` | Colores en `:root` (`--deep`, `--gold`, `--sand`) |

## Desplegar en Vercel

El repo git ya está inicializado con el primer commit hecho en la rama `main`.
Faltan dos pasos, los dos tuyos porque requieren tus cuentas:

**1. Subir el repo a GitHub.** Crea un repositorio vacío en
[github.com/new](https://github.com/new) (sin README, sin .gitignore) y luego,
desde esta carpeta:

```bash
git remote add origin https://github.com/TU-USUARIO/sonrisa-imperial.git
```

```bash
git push -u origin main
```

**2. Importar el proyecto en Vercel.** En [vercel.com](https://vercel.com) →
*Add New* → *Project* → *Import Git Repository* → elige el repo. En la pantalla
de configuración:

- **Framework Preset**: `Other`
- **Root Directory**: `./`
- **Build Command** y **Output Directory**: déjalos vacíos

Es un sitio estático puro, así que no hace falta ni build ni `vercel.json`.
Dale a *Deploy* y en menos de un minuto tienes la URL `*.vercel.app`. A partir
de ahí, cada `git push` a `main` redespliega solo.

Para usar tu propio dominio: *Project Settings* → *Domains* → añádelo y apunta
los DNS donde te indique Vercel.

### Antes del primer push

El commit está firmado como `Javier <javahuerta@gmail.com>` porque no tenías
identidad de git configurada. Si quieres otro nombre público en GitHub:

```bash
git config user.name "Tu Nombre" && git commit --amend --reset-author --no-edit
```

## El formulario de cita

`api/cita.js` es una función serverless que Vercel publica automáticamente en
`/api/cita`. Recibe el formulario, lo revalida en servidor y envía un email con
[Resend](https://resend.com). No usa el SDK de Resend sino su API REST vía
`fetch`, así que el proyecto sigue sin `package.json` ni dependencias.

### Puesta en marcha

**1. Crea la cuenta y la API key** en [resend.com/api-keys](https://resend.com/api-keys).

**2. Añade la variable en Vercel**: *Project Settings* → *Environment Variables*

| Variable | Obligatoria | Valor |
|---|---|---|
| `RESEND_API_KEY` | Sí | La clave `re_...` de Resend |
| `CITAS_TO` | No | Destinatario (por defecto `javahuerta@gmail.com`) |
| `CITAS_FROM` | No | Remitente; requiere dominio verificado en Resend |

**3. Redespliega** (*Deployments* → *Redeploy*): las variables solo se aplican
a despliegues nuevos.

### Sobre el remitente

Sin dominio propio, el envío sale desde `onboarding@resend.dev`, y Resend solo
permite entregarlo **a la dirección de tu propia cuenta**. Suficiente para
recibir las solicitudes tú, pero si algún día quieres enviar confirmaciones al
paciente, hay que verificar un dominio en Resend y ponerlo en `CITAS_FROM`.

### Detalles de implementación

- **Revalidación en servidor**: la validación del navegador es comodidad, no
  seguridad. El endpoint comprueba de nuevo cada campo y acota longitudes.
- **`reply_to`**: al responder al email contestas directamente al paciente.
- **Antispam**: campo trampa (*honeypot*) invisible; si viene relleno, la
  solicitud se descarta y se responde igualmente con éxito para no dar pistas.
- **Escapado HTML** de todos los datos antes de meterlos en el email.
- **La clave nunca llega al navegador**: vive solo en la variable de entorno.

### Probarlo en local

No se puede: `/api/cita` solo existe en Vercel. Abriendo `index.html` con doble
clic el envío fallará y verás el aviso de error (que es justo lo que debe pasar).
Para probar el circuito completo, despliega y usa la URL de producción.

## Notas

- Validación: nombre (mín. 3 caracteres), teléfono (9–15 dígitos, admite
  prefijo), email opcional con formato, motivo obligatorio y consentimiento
  de privacidad obligatorio.
- Antes de publicar, revisa el cumplimiento de RGPD: la política de privacidad
  debe existir de verdad y el tratamiento de datos de salud tiene requisitos
  específicos.
