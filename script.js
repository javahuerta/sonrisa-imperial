/* Sonrisa Imperial — validación y envío del formulario de cita */

(function () {
  'use strict';

  const form = document.getElementById('form-cita');
  if (!form) return;

  const success = document.getElementById('form-success');
  const successName = document.getElementById('success-name');

  const rules = {
    nombre: {
      test: (v) => v.trim().length >= 3,
      msg: 'Escribe tu nombre completo.'
    },
    telefono: {
      // 9 dígitos o más, admitiendo espacios, guiones y prefijo internacional
      test: (v) => (v.replace(/[\s\-().]/g, '').match(/^\+?\d{9,15}$/) !== null),
      msg: 'Introduce un teléfono válido.'
    },
    email: {
      test: (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      msg: 'Revisa el formato del email.'
    },
    motivo: {
      test: (v) => v !== '',
      msg: 'Selecciona el motivo de la visita.'
    },
    privacidad: {
      test: (_v, el) => el.checked,
      msg: 'Debes aceptar la política de privacidad.'
    }
  };

  function fieldOf(el) {
    return el.closest('.field');
  }

  function validate(el) {
    const rule = rules[el.name];
    if (!rule) return true;

    const ok = rule.test(el.value, el);
    const field = fieldOf(el);
    const error = field.querySelector('.error');

    field.classList.toggle('invalid', !ok);
    if (error) error.textContent = ok ? '' : rule.msg;
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');

    return ok;
  }

  // Revalida al salir del campo, y en vivo una vez que ya hay error marcado
  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    if (!el) return;
    el.addEventListener('blur', () => validate(el));
    el.addEventListener('change', () => validate(el));
    el.addEventListener('input', () => {
      if (fieldOf(el).classList.contains('invalid')) validate(el);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    let firstInvalid = null;
    Object.keys(rules).forEach((name) => {
      const el = form.elements[name];
      if (el && !validate(el) && !firstInvalid) firstInvalid = el;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const datos = Object.fromEntries(new FormData(form).entries());

    // ── Aquí se conecta el backend / servicio de email ──────────────
    // Ejemplo con un endpoint propio o un servicio tipo Formspree:
    //
    //   fetch('https://tu-endpoint.com/citas', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(datos)
    //   })
    //
    // Mientras tanto, mostramos la confirmación en cliente.
    console.log('Solicitud de cita:', datos);
    // ────────────────────────────────────────────────────────────────

    const nombre = (datos.nombre || '').trim().split(/\s+/)[0];
    successName.textContent = nombre ? ', ' + nombre : '';

    form.querySelectorAll('.field, .btn, .form-note').forEach((el) => {
      el.style.display = 'none';
    });
    success.hidden = false;
    success.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
})();
