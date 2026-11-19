/**
 * Cálculos del resumen de pregrado (VOU v4, fase 2).
 *
 * Reglas (validadas con Finanzas):
 *  - Total estimado = arancel referencial − beneficio estimado + matrícula.
 *  - El CAE y las becas ministeriales NO entran en ningún total (solo son referenciales).
 *  - Valor cuota estimado = round(total / n), con n ∈ {1, 3, 6, 10, 12}.
 *  - El descuento por pago al contado (modo de pago «contado») solo aplica con 1 cuota.
 *  - El descuento de pago anticipado (si hubiera uno vigente) se mantiene como antes.
 */

export const OPCIONES_CUOTAS = [1, 3, 6, 10, 12] as const
export const CUOTAS_POR_DEFECTO = 10

export interface EntradaResumen {
  /** Arancel de la carrera elegida (por id de carrera). */
  arancelBase: number
  /** Matrícula de la carrera. */
  matricula: number
  /** Monto de descuento de la beca UNIACC aplicada (0 si no aplica ninguna). */
  descuentoBeca: number
  /** Cuotas elegidas. */
  cuotas: number
  /** % de descuento por pago al contado (solo se usa si cuotas === 1). */
  pctContado?: number | null
  /** % de descuento de pago anticipado sobre arancel y sobre matrícula (si hay uno vigente). */
  pctAnticipadoArancel?: number | null
  pctAnticipadoMatricula?: number | null
}

export interface ResultadoResumen {
  cuotas: number
  esContado: boolean
  arancelReferencial: number
  matricula: number
  descuentoBeca: number
  descuentoContado: number
  descuentoAnticipadoArancel: number
  descuentoAnticipadoMatricula: number
  /** Suma de todos los descuentos aplicados (beca + pago). */
  beneficioEstimado: number
  arancelFinal: number
  matriculaFinal: number
  totalEstimado: number
  valorCuota: number
}

/** Fuerza que las cuotas sean una de las opciones válidas (si no, el valor por defecto). */
export function normalizarCuotas(cuotas: number): number {
  return (OPCIONES_CUOTAS as readonly number[]).includes(cuotas) ? cuotas : CUOTAS_POR_DEFECTO
}

export function calcularResumen(e: EntradaResumen): ResultadoResumen {
  const cuotas = normalizarCuotas(e.cuotas)
  const arancelReferencial = Math.max(0, Math.round(e.arancelBase || 0))
  const matricula = Math.max(0, Math.round(e.matricula || 0))
  const descuentoBeca = Math.min(arancelReferencial, Math.max(0, Math.round(e.descuentoBeca || 0)))
  const arancelConBeca = arancelReferencial - descuentoBeca

  const esContado = cuotas === 1
  const descuentoContado = esContado && e.pctContado
    ? Math.round(arancelConBeca * (e.pctContado / 100))
    : 0
  const descuentoAnticipadoArancel = e.pctAnticipadoArancel
    ? Math.round(arancelConBeca * (e.pctAnticipadoArancel / 100))
    : 0
  const descuentoAnticipadoMatricula = e.pctAnticipadoMatricula
    ? Math.round(matricula * (e.pctAnticipadoMatricula / 100))
    : 0

  const arancelFinal = Math.max(0, arancelConBeca - descuentoContado - descuentoAnticipadoArancel)
  const matriculaFinal = Math.max(0, matricula - descuentoAnticipadoMatricula)
  const totalEstimado = arancelFinal + matriculaFinal
  const beneficioEstimado = arancelReferencial + matricula - totalEstimado

  return {
    cuotas,
    esContado,
    arancelReferencial,
    matricula,
    descuentoBeca,
    descuentoContado,
    descuentoAnticipadoArancel,
    descuentoAnticipadoMatricula,
    beneficioEstimado,
    arancelFinal,
    matriculaFinal,
    totalEstimado,
    valorCuota: Math.round(totalEstimado / cuotas)
  }
}

/** % de descuento por pago al contado entre los modos de pago activos (null si no hay). */
export function pctContadoDesdeModosPago(
  modos: Array<{ nombre?: string | null; dscto_arancel?: number | null }>
): number | null {
  const m = modos.find((d) => {
    const n = (d.nombre || '').toLowerCase()
    return n.includes('contado') || n.includes('efectivo')
  })
  return m?.dscto_arancel ? Number(m.dscto_arancel) : null
}

export const TEXTOS_RESUMEN = {
  referencial: 'Simulación referencial · sujeta a validación',
  sujetaARequisitos: 'Sujeta a requisitos',
  sinBeca: 'Con tus datos no identificamos una beca UNIACC; Admisión puede revisar tu caso',
  disclaimerTitulo: 'Simulación referencial.',
  disclaimerCuerpo:
    'Los beneficios y becas UNIACC están sujetos a la validación de requisitos y antecedentes por parte de Admisión. ' +
    'La asignación de becas ministeriales y CAE depende de los procesos oficiales de preselección y selección y de la normativa vigente.',
  vigencia:
    'Esta simulación tiene una duración de 1 semana a contar de hoy. Una vez excedido ese plazo, deberás volver a simular.',
  email: 'admision@uniacc.cl',
  telefonos: [
    { texto: '+56 22 640 6100', tel: '+56226406100' },
    { texto: '+56 22 640 6151', tel: '+56226406151' }
  ]
} as const

/** Textos del modal del paso 2 (VOU v4, fase 3). */
export const TEXTOS_MODAL = {
  notaRequisitos:
    'Las becas ministeriales y el CAE tienen requisitos académicos y socioeconómicos amplios. ' +
    'Su asignación depende de los procesos oficiales de preselección y selección, según la normativa vigente.',
  ayudaPaes: 'Algunas becas exigen requisitos académicos.',
  ayudaFinanciamiento: 'Becas ministeriales y/o Crédito con Aval del Estado (CAE).',
  ayudaPuntaje: 'Puntaje entre 150 y 1000.',
  ayudaRenta:
    'Toma el total de ingresos de tu hogar y divídelo por la cantidad de personas que viven en él.'
} as const

/**
 * Etiqueta de la beca aplicada («Nombre · 25% · Sujeta a requisitos»).
 * La usan el resumen y el motor de becas del modal para que digan exactamente lo mismo.
 */
export function etiquetaBecaAplicada(
  b: { beca?: { nombre?: string | null; tipo_descuento?: string | null } | null; monto_descuento?: number | null; descuento_aplicado?: number | null },
  formatearMonto: (n: number) => string
): string {
  const valor = b.beca?.tipo_descuento === 'monto_fijo'
    ? formatearMonto(b.monto_descuento || 0)
    : `${b.descuento_aplicado}%`
  return `${b.beca?.nombre || 'Beca UNIACC'} · ${valor} · ${TEXTOS_RESUMEN.sujetaARequisitos}`
}
