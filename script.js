/* Sonrisa Imperial — validación y envío del formulario de cita */

(function () {
  'use strict';

  const form = document.getElementById('form-cita');
  if (!form) return;

  const success = document.getElementById('form-success');
  const successName = document.getElementById('success-name');
  const errorBox = document.getElementById('form-error');
  const boton = form.querySelector('button[type="submit"]');
  const textoBoton = boton.textContent;

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

  function mostrarError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function mostrarConfirmacion(nombreCompleto) {
    const nombre = (nombreCompleto || '').trim().split(/\s+/)[0];
    successName.textContent = nombre ? ', ' + nombre : '';

    form.querySelectorAll('.field, .btn, .form-note').forEach((el) => {
      el.style.display = 'none';
    });
    success.hidden = false;
    success.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorBox.hidden = true;

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

    boton.disabled = true;
    boton.textContent = 'Enviando…';

    try {
      const respuesta = await fetch('/api/cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        // El servidor revalida: si marca campos concretos, los señalamos.
        Object.entries(resultado.errores || {}).forEach(([campo, msg]) => {
          const el = form.elements[campo];
          if (!el) return;
          const field = fieldOf(el);
          field.classList.add('invalid');
          const error = field.querySelector('.error');
          if (error) error.textContent = msg;
        });
        mostrarError(resultado.error || 'No hemos podido enviar tu solicitud. Inténtalo de nuevo en un momento.');
        return;
      }

      mostrarConfirmacion(datos.nombre);
    } catch (err) {
      mostrarError('No hemos podido conectar. Revisa tu conexión o escríbenos a javahuerta@gmail.com.');
    } finally {
      boton.disabled = false;
      boton.textContent = textoBoton;
    }
  });
})();
