/* Sonrisa Imperial — agenda del hero, validación y envío del formulario */

(function () {
  'use strict';

  const form = document.getElementById('form-cita');
  if (!form) return;

  const success = document.getElementById('form-success');
  const successName = document.getElementById('success-name');
  const errorBox = document.getElementById('form-error');
  const boton = form.querySelector('button[type="submit"]');
  const textoBoton = boton.textContent;

  /* --- Agenda del hero ---------------------------------------------------
     Elegir día y franja arriba rellena el formulario de abajo. No afirma
     disponibilidad: es una preferencia que la clínica confirma al llamar. */

  const TARDE = 'Tarde (15:00 – 20:00)';
  const MANANA = 'Mañana (9:00 – 14:00)';
  const DIAS_VISIBLES = 6;

  const agenda = document.getElementById('agenda');
  const selectDia = form.elements.dia;
  const selectFranja = form.elements.preferencia;

  const iso = (d) =>
    d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');

  const esSabado = (d) => d.getDay() === 6;

  // Domingo cerrado: se salta al construir la lista.
  function proximosDias(cantidad) {
    const dias = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (dias.length < cantidad) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 0) dias.push(new Date(cursor));
    }
    return dias;
  }

  const abrevDia = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
  const nombreLargo = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const dias = proximosDias(DIAS_VISIBLES);
  const sabados = new Set(dias.filter(esSabado).map(iso));

  // El sábado se cierra a las 14:00, así que la franja de tarde no existe.
  function ajustarTarde(valorDia) {
    const cerrado = sabados.has(valorDia);

    const opcionTarde = Array.from(selectFranja.options).find((o) => o.value === TARDE);
    if (opcionTarde) {
      opcionTarde.disabled = cerrado;
      if (cerrado && selectFranja.value === TARDE) selectFranja.value = MANANA;
    }

    if (agenda) {
      const radioTarde = agenda.querySelector('input[name="agenda-franja"][value="' + TARDE + '"]');
      if (radioTarde) {
        radioTarde.disabled = cerrado;
        if (cerrado && radioTarde.checked) {
          const radioManana = agenda.querySelector('input[name="agenda-franja"][value="' + MANANA + '"]');
          if (radioManana) radioManana.checked = true;
        }
      }
    }
  }

  if (selectDia) {
    dias.forEach((d) => {
      const opcion = document.createElement('option');
      opcion.value = iso(d);
      opcion.textContent = nombreLargo.format(d);
      selectDia.appendChild(opcion);
    });
    selectDia.addEventListener('change', () => ajustarTarde(selectDia.value));
  }

  if (agenda) {
    const contenedor = document.getElementById('agenda-dias');

    dias.forEach((d) => {
      const valor = iso(d);
      const etiqueta = document.createElement('label');
      etiqueta.className = 'chip chip-dia';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'agenda-dia';
      radio.value = valor;

      // La abreviatura y el número son la lectura visual; quien usa lector de
      // pantalla oye la fecha completa y no "LUN 3, lunes 3 de agosto".
      const sem = document.createElement('span');
      sem.className = 'chip-sem';
      sem.setAttribute('aria-hidden', 'true');
      sem.textContent = abrevDia.format(d).replace('.', '').slice(0, 3).toUpperCase();

      const num = document.createElement('span');
      num.className = 'chip-num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = d.getDate();

      const oculto = document.createElement('span');
      oculto.className = 'sr-only';
      oculto.textContent = nombreLargo.format(d);

      etiqueta.append(radio, sem, num, oculto);
      contenedor.appendChild(etiqueta);
    });

    contenedor.addEventListener('change', (e) => ajustarTarde(e.target.value));

    agenda.addEventListener('submit', (e) => {
      e.preventDefault();

      const dia = agenda.querySelector('input[name="agenda-dia"]:checked');
      const franja = agenda.querySelector('input[name="agenda-franja"]:checked');

      if (dia && selectDia) selectDia.value = dia.value;
      if (franja) selectFranja.value = franja.value;
      ajustarTarde(selectDia ? selectDia.value : '');

      document.getElementById('cita').scrollIntoView({ behavior: 'smooth', block: 'start' });
      form.elements.nombre.focus({ preventScroll: true });
    });
  }

  /* --- Validación en cliente -------------------------------------------- */

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
