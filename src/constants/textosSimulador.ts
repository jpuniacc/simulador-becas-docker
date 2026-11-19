/**
 * Textos del simulador de pregrado (propuesta agencia VOU v4, validados por Finanzas).
 * Fuente única: editar aquí, no en cada vista.
 */
export const TEXTOS = {
  meta: {
    descripcion:
      'Conoce a qué beneficios puedes acceder en UNIACC. Simulación referencial y sin compromiso.'
  },
  home: {
    titulo: 'Conoce a qué beneficios puedes acceder',
    subtitulo: 'Simula las becas y beneficios para tu carrera en pocos pasos.',
    boton: 'Calcular mis beneficios',
    confianza: ['Sin compromiso', 'Simulación referencial'],
    comoFuncionaTitulo: 'Cómo funciona',
    pasos: ['Elige tu camino', 'Completa tus datos y carrera', 'Revisa tu resumen de beneficios'],
    nota:
      '* Simulación referencial, sujeta a validación de requisitos y antecedentes por parte de Admisión UNIACC.'
  },
  camino: {
    titulo: 'Elige tu camino',
    subtitulo: 'Selecciona el tipo de programa que quieres simular.',
    pregrado: {
      titulo: 'Pregrado',
      descripcion: 'Carreras profesionales y técnicas',
      boton: 'Simular pregrado'
    },
    postgrado: {
      titulo: 'Postgrado',
      descripcion: 'Magíster y diplomados',
      chip: 'Próximamente'
    },
    volver: 'Volver al inicio'
  },
  paso1: {
    titulo: 'Conoce las becas que se ajustan a tu perfil',
    subtitulo: 'Completa tus datos y te mostramos al instante las becas que aplican a tu caso.',
    grupoSobreTi: 'Sobre ti',
    grupoContacto: '¿Cómo te contactamos?',
    grupoEstudios: 'Tus estudios',
    placeholders: {
      nombre: 'Ej: Camila',
      apellido: 'Ej: Rojas',
      rut: 'Ej: 12.345.678-9',
      identificacion: 'Rut provisorio/Pasaporte/DNI',
      anioNacimiento: 'Ej: 2007',
      email: 'tu@correo.cl',
      telefono: '1234 5678',
      anioEgreso: 'Ej: 2023',
      ranking: 'Ej: 700',
      nem: 'Ej: 5,5'
    },
    privacidadContacto:
      'Aceptas que el equipo de admisión de UNIACC te contacte para orientarte sobre programas y resolver tus dudas, usando los datos que ingresaste.',
    privacidadFines: '* Solo usamos tus datos con fines de orientación académica.',
    privacidadSimulacion: 'Tus datos se usan sólo para esta simulación. Al continuar, aceptas su uso.'
  }
} as const
