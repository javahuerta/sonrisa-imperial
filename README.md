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

## Conectar el formulario

Ahora mismo el formulario valida en cliente y muestra una confirmación, pero
**no envía nada a ningún sitio**. En `script.js` hay un bloque marcado donde
conectar el backend: sustituye el `console.log` por un `fetch` a tu endpoint o
a un servicio tipo Formspree / Getform, y muestra la confirmación solo cuando
la respuesta sea correcta.

Estando en Vercel, la opción más limpia es una función serverless: un archivo
`api/cita.js` en el repo se publica solo como endpoint `/api/cita`, y desde ahí
envías el email (Resend, SendGrid) sin exponer ninguna clave en el navegador.

## Notas

- Validación: nombre (mín. 3 caracteres), teléfono (9–15 dígitos, admite
  prefijo), email opcional con formato, motivo obligatorio y consentimiento
  de privacidad obligatorio.
- Antes de publicar, revisa el cumplimiento de RGPD: la política de privacidad
  debe existir de verdad y el tratamiento de datos de salud tiene requisitos
  específicos.
