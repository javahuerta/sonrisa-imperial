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

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

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

  if (!process.env.RESEND_API_KEY) {
    console.error('[cita] Falta la variable de entorno RESEND_API_KEY');
    return res.status(500).json({
      error: 'El formulario no está configurado todavía. Escríbenos a ' + DESTINATARIO + ' y te damos cita.'
    });
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
    ['Franja preferida', franja],
    ['Mensaje', mensaje || '—'],
    ['Recibido', recibido]
  ];

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a18;line-height:1.6">
      <h2 style="font-weight:500;color:#12332f;margin:0 0 16px">Nueva solicitud de cita</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:560px">
        ${filas.map(([campo, valor]) => `
          <tr>
            <td style="padding:10px 16px 10px 0;border-bottom:1px solid #e2ded3;color:#6b6f6b;font-size:13px;white-space:nowrap;vertical-align:top">${escapar(campo)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e2ded3;font-size:15px">${escapar(valor).replace(/\n/g, '<br>')}</td>
          </tr>`).join('')}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#6b6f6b">Enviado desde el formulario de sonrisaimperial</p>
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
