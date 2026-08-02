/**
 * POST /api/cita — recibe una solicitud de cita y la envía por email con Resend.
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY  obligatoria — clave de resend.com
 *   CITAS_TO        opcional    — destinatario (por defecto javahuerta@gmail.com)
 *   CITAS_FROM      opcional    — remitente; requiere dominio verificado en Resend
 *
 * Sin dependencias: usa el fetch global del runtime de Node en Vercel.
 */

const DESTINATARIO = process.env.CITAS_TO || 'javahuerta@gmail.com';
const REMITENTE = process.env.CITAS_FROM || 'Sonrisa Imperial <onboarding@resend.dev>';

const MOTIVOS = [
  'Revisión y limpieza',
  'Estética dental',
  'Ortodoncia',
  'Implantes',
  'Odontopediatría',
  'Urgencia / dolor',
  'Otro'
];

const FRANJAS = ['Mañana (9:00 – 14:00)', 'Tarde (15:00 – 20:00)', 'Me adapto'];

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// El día llega como AAAA-MM-DD y se formatea aquí: así no entra texto
// arbitrario del navegador en el email, solo una fecha válida y acotada.
function diaLegible(valor) {
  if (!FECHA_ISO.test(valor)) return 'Sin preferencia';

  const fecha = new Date(valor + 'T12:00:00Z');
  if (Number.isNaN(fecha.getTime())) return 'Sin preferencia';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + 90);

  if (fecha < hoy || fecha > limite) return 'Sin preferencia';

  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(fecha);
}

const escapar = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

const telefonoValido = (v) => /^\+?\d{9,15}$/.test(v.replace(/[\s\-().]/g, ''));
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = {}; }
  }
  if (!cuerpo || typeof cuerpo !== 'object') cuerpo = {};

  // Trampa antispam: campo oculto que un humano nunca rellena. Si viene con
  // contenido, respondemos como si todo hubiera ido bien y descartamos el envío.
  if (texto(cuerpo.empresa, 100)) {
    console.warn('[cita] Descartada por honeypot');
    return res.status(200).json({ ok: true });
  }

  const nombre = texto(cuerpo.nombre, 120);
  const telefono = texto(cuerpo.telefono, 30);
  const email = texto(cuerpo.email, 160);
  const motivo = texto(cuerpo.motivo, 60);
  const dia = texto(cuerpo.dia, 10);
  const preferencia = texto(cuerpo.preferencia, 60);
  const mensaje = texto(cuerpo.mensaje, 2000);
  const privacidad = cuerpo.privacidad;

  // Se revalida en servidor: la validación del navegador es comodidad, no seguridad.
  const errores = {};
  if (nombre.length < 3) errores.nombre = 'Escribe tu nombre completo.';
  if (!telefonoValido(telefono)) errores.telefono = 'Introduce un teléfono válido.';
  if (email && !emailValido(email)) errores.email = 'Revisa el formato del email.';
  if (!MOTIVOS.includes(motivo)) errores.motivo = 'Selecciona el motivo de la visita.';
  if (!privacidad) errores.privacidad = 'Debes aceptar la política de privacidad.';

  if (Object.keys(errores).length) {
    return res.status(400).json({ error: 'Revisa los campos marcados.', errores });
  }

  // La configuración se comprueba después de validar, para que los errores de
  // campo lleguen al usuario aunque el envío no esté configurado todavía.
  if (!process.env.RESEND_API_KEY) {
    console.error('[cita] Falta la variable de entorno RESEND_API_KEY');
    return res.status(500).json({
      error: 'El formulario no está configurado todavía. Escríbenos a ' + DESTINATARIO + ' y te damos cita.'
    });
  }

  const franja = FRANJAS.includes(preferencia) ? preferencia : 'Me adapto';

  const recibido = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const filas = [
    ['Nombre', nombre],
    ['Teléfono', telefono],
    ['Email', email || '—'],
    ['Motivo', motivo],
    ['Día preferido', diaLegible(dia)],
    ['Franja preferida', franja],
    ['Mensaje', mensaje || '—'],
    ['Recibido', recibido]
  ];

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e2124;line-height:1.6">
      <h2 style="font-weight:500;color:#5b1d46;margin:0 0 16px">Nueva solicitud de cita</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:560px">
        ${filas.map(([campo, valor]) => `
          <tr>
            <td style="padding:10px 16px 10px 0;border-bottom:1px solid #dce0de;color:#63696b;font-size:13px;white-space:nowrap;vertical-align:top">${escapar(campo)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #dce0de;font-size:15px">${escapar(valor).replace(/\n/g, '<br>')}</td>
          </tr>`).join('')}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#63696b">Enviado desde el formulario de sonrisaimperial</p>
    </div>`;

  const plano = filas.map(([campo, valor]) => `${campo}: ${valor}`).join('\n');

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [DESTINATARIO],
        subject: `Cita: ${nombre} — ${motivo}`,
        html,
        text: plano,
        // Así, al responder al email se contesta directamente al paciente.
        ...(email ? { reply_to: email } : {})
      })
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('[cita] Resend respondió', respuesta.status, detalle);
      return res.status(502).json({
        error: 'No hemos podido registrar tu solicitud. Vuelve a intentarlo o escríbenos a ' + DESTINATARIO + '.'
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[cita] Error enviando el email:', err);
    return res.status(502).json({
      error: 'No hemos podido registrar tu solicitud. Vuelve a intentarlo o escríbenos a ' + DESTINATARIO + '.'
    });
  }
};
