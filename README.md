# Sonrisa Imperial — Landing page

Landing de una sola página para una clínica dental. Objetivo único: que el
visitante solicite una cita.

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

## Conectar el formulario

Ahora mismo el formulario valida en cliente y muestra una confirmación, pero
**no envía nada a ningún sitio**. En `script.js` hay un bloque marcado donde
conectar el backend: sustituye el `console.log` por un `fetch` a tu endpoint o
a un servicio tipo Formspree / Getform, y muestra la confirmación solo cuando
la respuesta sea correcta.

## Notas

- Validación: nombre (mín. 3 caracteres), teléfono (9–15 dígitos, admite
  prefijo), email opcional con formato, motivo obligatorio y consentimiento
  de privacidad obligatorio.
- Antes de publicar, revisa el cumplimiento de RGPD: la política de privacidad
  debe existir de verdad y el tratamiento de datos de salud tiene requisitos
  específicos.
