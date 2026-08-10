import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { UNIACC_LOGO_DATA_URL } from '@/assets/universidadUniaccLogoBase64'
import { formatCurrency, formatRUT } from '@/utils/formatters'

type PdfNode = Record<string, unknown> | string
type PdfContent = PdfNode | PdfNode[]

export interface SimulacionPdfBeca {
  nombre: string
  descuentoAplicado?: number | null
  montoDescuento?: number | null
  tipoDescuento?: string | null
  procesoEvaluacion?: string | null
}

export interface SimulacionPdfPayload {
  nombre: string
  apellido: string
  identificacion: string
  tipoIdentificacion?: 'rut' | 'pasaporte' | ''
  email: string
  carreraNombre: string
  nivelAcademico?: string | null
  modalidadPrograma?: string | null
  duracionPrograma?: string | null
  arancelBase: number
  matricula: number
  becasInternas?: SimulacionPdfBeca[]
  arancelDespuesBecasInternas?: number | null
  usaBecasEstado?: boolean
  planeaUsarCAE?: boolean
  descuentoCae?: number | null
  arancelFinal?: number | null
  descuentoPagoAnticipadoArancel?: number | null
  descuentoPagoAnticipadoMatricula?: number | null
  descuentoPagoAnticipadoPctArancel?: number | null
  descuentoPagoAnticipadoPctMatricula?: number | null
  descuentoModoPagoArancel?: number | null
  descuentoModoPagoPct?: number | null
  descuentoModoPagoNombre?: string | null
  totalDescuentos?: number | null
  descuentoTotalConAdicionales?: number | null
  descuentoPorcentualTotal?: number | null
  arancelFinalConDescuentos?: number | null
  matriculaFinalConDescuentos?: number | null
  totalPagar?: number | null
  numeroCuotas?: number | null
  valorMensual?: number | null
  medioPagoLabel?: string | null
  fecha?: Date
}

const BRAND = '#1A3B66'
const GREEN = '#28B911'
const GREEN_DARK = '#155708'
const DISCOUNT_BG = '#E8F1FA'
const FINAL_BG = '#EAF8E8'
const DISCLAIMER_BG = '#F0F8FB'
const CARD_BORDER = '#D0D7DE'
const MUTED = '#64748B'

let vfsReady = false

function ensurePdfMakeVfs() {
  if (vfsReady) return
  const fonts = pdfFonts as Record<string, string> & { pdfMake?: { vfs?: Record<string, string> } }
  pdfMake.vfs = fonts.pdfMake?.vfs || fonts
  vfsReady = true
}

export function slugFilename(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    || 'sin_dato'
}

function formatYyyymmdd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export function buildSimulacionPdfFilename(input: {
  nombre: string
  apellido: string
  carrera: string
  date?: Date
}): string {
  const date = input.date ?? new Date()
  const alumno = slugFilename(`${input.nombre}_${input.apellido}`)
  const carrera = slugFilename(input.carrera)
  return `${formatYyyymmdd(date)}_${alumno}_${carrera}_simulador_uniacc.pdf`
}

function formatIdentificacion(
  identificacion: string,
  tipoIdentificacion?: 'rut' | 'pasaporte' | ''
): string {
  if (!identificacion) return '—'
  if (tipoIdentificacion === 'pasaporte') return identificacion
  return formatRUT(identificacion) || identificacion
}

function money(amount: number | null | undefined): string {
  return formatCurrency(amount ?? 0)
}

function cardLayout(options?: { fill?: string | null; border?: string }) {
  const fill = options?.fill ?? null
  const border = options?.border ?? CARD_BORDER
  return {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => border,
    vLineColor: () => border,
    fillColor: () => fill,
    paddingLeft: () => 12,
    paddingRight: () => 12,
    paddingTop: () => 10,
    paddingBottom: () => 10
  }
}

function card(title: string | null, body: PdfContent[], options?: { fill?: string | null; margin?: number[] }): PdfNode {
  const rows: unknown[][] = []
  if (title) {
    rows.push([{ text: title, style: 'cardTitle', margin: [0, 0, 0, 6] }])
  }
  rows.push([{ stack: body }])

  return {
    table: {
      widths: ['*'],
      body: rows
    },
    layout: cardLayout({ fill: options?.fill }),
    margin: options?.margin ?? [0, 0, 0, 10]
  }
}

function tag(text: string): PdfNode {
  return {
    text: `  ${text}  `,
    fontSize: 8,
    color: BRAND,
    bold: true,
    margin: [0, 0, 6, 0]
  }
}

function detailHeader(): unknown[] {
  return [
    { text: 'Concepto', style: 'tableHeader' },
    { text: 'Tipo', style: 'tableHeader' },
    { text: 'Descuento', style: 'tableHeader' },
    { text: 'Monto', style: 'tableHeader', alignment: 'right' }
  ]
}

function detailRow(
  concepto: string,
  tipo: string,
  descuento: string,
  monto: string,
  options?: { bold?: boolean; color?: string }
): unknown[] {
  const style = options?.bold ? 'tableRowBold' : 'tableRow'
  const color = options?.color
  return [
    { text: concepto, style, color },
    { text: tipo, style, color },
    { text: descuento, style, color },
    { text: monto, style, alignment: 'right', color }
  ]
}

function highlightBar(label: string, value: string, colors: { bg: string; fg: string }): PdfNode {
  return {
    table: {
      widths: ['*', 'auto'],
      body: [[
        { text: label, color: colors.fg, bold: true, fontSize: 10 },
        { text: value, color: colors.fg, bold: true, fontSize: 11, alignment: 'right' }
      ]]
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      fillColor: () => colors.bg,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 8,
      paddingBottom: () => 8
    },
    margin: [0, 6, 0, 0]
  }
}

function summaryMiniCard(title: string, subtitle: string, value: string, colors: { bg: string; title: string; value: string }): PdfNode {
  return {
    table: {
      widths: ['*'],
      body: [[{
        stack: [
          { text: title, bold: true, fontSize: 9, color: colors.title, alignment: 'center', margin: [0, 0, 0, 4] },
          { text: subtitle, fontSize: 8, color: MUTED, alignment: 'center' },
          { text: value, bold: true, fontSize: 14, color: colors.value, alignment: 'center', margin: [0, 6, 0, 0] }
        ],
        fillColor: colors.bg
      }]]
    },
    layout: cardLayout({ fill: colors.bg, border: colors.bg })
  }
}

export function buildSimulacionPdfDefinition(payload: SimulacionPdfPayload): Record<string, unknown> {
  const fecha = payload.fecha ?? new Date()
  const fechaLabel = fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const idLabel = payload.tipoIdentificacion === 'pasaporte' ? 'Pasaporte' : 'RUT'
  const cuotas = Math.max(1, payload.numeroCuotas || 1)
  const textoCuota = cuotas === 1 ? 'cuota' : 'cuotas'
  const arancelCuota = Math.round((payload.arancelBase || 0) / cuotas)
  const matriculaCuota = Math.round((payload.matricula || 0) / cuotas)
  const totalDescuentos = payload.descuentoTotalConAdicionales ?? payload.totalDescuentos ?? 0
  const arancelFinal = payload.arancelFinalConDescuentos ?? payload.arancelFinal ?? 0
  const matriculaFinal = payload.matriculaFinalConDescuentos ?? payload.matricula ?? 0
  const totalPagar = payload.totalPagar ?? (arancelFinal + matriculaFinal)
  const valorMensual = payload.valorMensual ?? Math.round(totalPagar / cuotas)

  const detalleBase: unknown[][] = [
    detailHeader(),
    detailRow('Arancel Base', '-', '-', money(payload.arancelBase)),
    detailRow('Matrícula', '-', '-', money(payload.matricula))
  ]

  const content: PdfContent[] = [
    {
      columns: [
        {
          image: 'uniaccLogo',
          width: 52,
          margin: [0, 0, 12, 0]
        },
        {
          width: '*',
          stack: [
            { text: 'Simulador de Becas UNIACC', style: 'header', margin: [0, 4, 0, 2] },
            { text: `Simulación generada el ${fechaLabel}`, style: 'subheader' }
          ]
        }
      ],
      margin: [0, 0, 0, 14]
    },

    card('Información de la Carrera', [
      { text: payload.carreraNombre || '—', style: 'careerName', margin: [0, 0, 0, 8] },
      {
        columns: [
          tag(payload.nivelAcademico || '—'),
          tag(payload.modalidadPrograma || '—'),
          tag(payload.duracionPrograma || '—'),
          { text: '', width: '*' }
        ]
      }
    ]),

    card('Datos del alumno', [
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Nombre', style: 'fieldLabel' },
              { text: `${payload.nombre || '—'} ${payload.apellido || ''}`.trim(), style: 'fieldValue' }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: idLabel, style: 'fieldLabel' },
              { text: formatIdentificacion(payload.identificacion, payload.tipoIdentificacion), style: 'fieldValue' }
            ]
          }
        ],
        margin: [0, 0, 0, 8]
      },
      {
        stack: [
          { text: 'Email', style: 'fieldLabel' },
          { text: payload.email || '—', style: 'fieldValue' }
        ]
      }
    ]),

    card('Detalle de la simulación', [
      {
        table: {
          headerRows: 1,
          widths: ['*', 70, 70, 80],
          body: detalleBase
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? BRAND : null),
          hLineWidth: () => 0.4,
          vLineWidth: () => 0.4,
          hLineColor: () => '#CBD5E1',
          vLineColor: () => '#CBD5E1',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 5,
          paddingBottom: () => 5
        },
        margin: [0, 0, 0, 8]
      },

      ...(payload.usaBecasEstado
        ? [{
            stack: [
              { text: 'Becas Ministeriales', style: 'subsectionTitle', margin: [0, 4, 0, 4] },
              {
                text: 'Las becas se asignan de acuerdo con la información entregada en la postulación al FUAS, donde el Estado otorga el beneficio en función de requisitos académicos y socioeconómicos. Más información en beneficiosestudiantiles.cl.',
                style: 'note'
              }
            ],
            margin: [0, 0, 0, 8]
          }]
        : []),

      ...((payload.becasInternas?.length || 0) > 0
        ? [{
            stack: [
              { text: 'Beneficios Internos (UNIACC)', style: 'subsectionTitle', margin: [0, 4, 0, 4] },
              {
                table: {
                  widths: ['*', 70, 50, 80],
                  body: [
                    ...payload.becasInternas!.map((beca) => detailRow(
                      beca.nombre || 'Beca',
                      'Porcentaje',
                      beca.descuentoAplicado != null ? `${beca.descuentoAplicado}%` : '—',
                      `-${money(beca.montoDescuento ?? 0)}`,
                      { color: GREEN_DARK }
                    )),
                    detailRow(
                      'Monto a pagar con beneficio aplicado',
                      '',
                      '',
                      money(payload.arancelDespuesBecasInternas),
                      { bold: true }
                    )
                  ]
                },
                layout: {
                  hLineWidth: () => 0.3,
                  vLineWidth: () => 0,
                  hLineColor: () => '#E2E8F0',
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 4,
                  paddingBottom: () => 4
                }
              }
            ],
            margin: [0, 0, 0, 8]
          }]
        : []),

      ...(payload.planeaUsarCAE
        ? [{
            stack: [
              { text: 'Arancel referencial CAE', style: 'subsectionTitle', margin: [0, 4, 0, 4] },
              {
                table: {
                  widths: ['*', 50, 40, 80],
                  body: [
                    detailRow(
                      '% Arancel referencial total al que se está accediendo con CAE',
                      'CAE',
                      '',
                      money(payload.descuentoCae),
                      { color: '#B45309' }
                    ),
                    detailRow(
                      'Monto a pagar con beneficio aplicado',
                      '',
                      '',
                      money(payload.arancelFinal),
                      { bold: true }
                    )
                  ]
                },
                layout: {
                  hLineWidth: () => 0.3,
                  vLineWidth: () => 0,
                  hLineColor: () => '#E2E8F0',
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 4,
                  paddingBottom: () => 4
                }
              }
            ],
            margin: [0, 0, 0, 8]
          }]
        : []),

      ...((payload.descuentoPagoAnticipadoArancel || 0) > 0
        || (payload.descuentoPagoAnticipadoMatricula || 0) > 0
        || (payload.descuentoModoPagoArancel || 0) > 0
        ? [{
            stack: [
              { text: 'Descuentos adicionales', style: 'subsectionTitle', margin: [0, 4, 0, 4] },
              {
                table: {
                  widths: ['*', 70, 50, 80],
                  body: [
                    ...((payload.descuentoPagoAnticipadoArancel || 0) > 0
                      ? [detailRow(
                          'Descuento por pago anticipado (Arancel)',
                          'Porcentaje',
                          payload.descuentoPagoAnticipadoPctArancel != null
                            ? `${payload.descuentoPagoAnticipadoPctArancel}%`
                            : '—',
                          `-${money(payload.descuentoPagoAnticipadoArancel)}`
                        )]
                      : []),
                    ...((payload.descuentoPagoAnticipadoMatricula || 0) > 0
                      ? [detailRow(
                          'Descuento por pago anticipado (Matrícula)',
                          'Porcentaje',
                          payload.descuentoPagoAnticipadoPctMatricula != null
                            ? `${payload.descuentoPagoAnticipadoPctMatricula}%`
                            : '—',
                          `-${money(payload.descuentoPagoAnticipadoMatricula)}`
                        )]
                      : []),
                    ...((payload.descuentoModoPagoArancel || 0) > 0
                      ? [detailRow(
                          payload.descuentoModoPagoNombre
                            ? `Descuento por medio de pago - ${payload.descuentoModoPagoNombre}`
                            : 'Descuento por medio de pago',
                          'Porcentaje',
                          payload.descuentoModoPagoPct != null ? `${payload.descuentoModoPagoPct}%` : '—',
                          `-${money(payload.descuentoModoPagoArancel)}`
                        )]
                      : [])
                  ]
                },
                layout: {
                  hLineWidth: () => 0.3,
                  vLineWidth: () => 0,
                  hLineColor: () => '#E2E8F0',
                  paddingLeft: () => 2,
                  paddingRight: () => 2,
                  paddingTop: () => 4,
                  paddingBottom: () => 4
                }
              }
            ],
            margin: [0, 0, 0, 4]
          }]
        : []),

      ...(totalDescuentos > 0
        ? [highlightBar('Total descuentos aplicados', `-${money(totalDescuentos)}`, { bg: DISCOUNT_BG, fg: BRAND })]
        : []),

      highlightBar('Arancel + Matrícula final a pagar', money(totalPagar), { bg: FINAL_BG, fg: GREEN_DARK })
    ]),

    card('Simulación de cuotas y medios de pago', [
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Medio de pago', style: 'fieldLabel' },
              { text: payload.medioPagoLabel || 'No seleccionado', style: 'fieldValue' }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: `Número de ${textoCuota}`, style: 'fieldLabel' },
              { text: String(cuotas), style: 'fieldValue' }
            ]
          }
        ]
      }
    ]),

    {
      columns: [
        summaryMiniCard(
          'Arancel Original',
          `${cuotas} ${textoCuota} de`,
          money(arancelCuota),
          { bg: '#F8FAFC', title: '#0F172A', value: '#0F172A' }
        ),
        { width: 8, text: '' },
        summaryMiniCard(
          'Matrícula',
          `${cuotas} ${textoCuota} de`,
          money(matriculaCuota),
          { bg: '#F8FAFC', title: '#0F172A', value: '#0F172A' }
        ),
        { width: 8, text: '' },
        summaryMiniCard(
          'Descuento Total',
          ' ',
          `-${money(totalDescuentos)}`,
          { bg: DISCOUNT_BG, title: BRAND, value: BRAND }
        )
      ],
      margin: [0, 0, 0, 10]
    },

    {
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            { text: 'Total Final a Pagar en Plan de', bold: true, fontSize: 11, color: GREEN_DARK, alignment: 'center' },
            { text: `${cuotas} ${textoCuota} de`, fontSize: 10, color: GREEN_DARK, alignment: 'center', margin: [0, 2, 0, 4] },
            { text: money(valorMensual), bold: true, fontSize: 20, color: GREEN, alignment: 'center', margin: [0, 0, 0, 8] },
            { text: `* Arancel final: ${money(arancelFinal)}`, fontSize: 9, color: GREEN_DARK, alignment: 'center' },
            { text: `* Matrícula final: ${money(matriculaFinal)}`, fontSize: 9, color: GREEN_DARK, alignment: 'center' },
            {
              text: '* Consulta con un asesor otros tipos de descuentos disponibles',
              fontSize: 8,
              color: GREEN_DARK,
              alignment: 'center',
              margin: [0, 6, 0, 0]
            }
          ],
          fillColor: FINAL_BG
        }]]
      },
      layout: cardLayout({ fill: FINAL_BG, border: '#C6E8C4' }),
      margin: [0, 0, 0, 10]
    },

    {
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            {
              text: [
                { text: '*Simulación referencial: ', bold: true, color: '#001122' },
                { text: 'Un asesor revisará tu caso y confirmará el monto final. ', color: BRAND },
                {
                  text: 'Esta simulación tiene una duración de 1 semana a contar de hoy. Una vez excedido ese plazo, deberás volver a simular.',
                  color: BRAND
                }
              ],
              fontSize: 9,
              lineHeight: 1.3
            }
          ],
          fillColor: DISCLAIMER_BG
        }]]
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i: number) => (i === 0 ? 3 : 0),
        vLineColor: () => BRAND,
        fillColor: () => DISCLAIMER_BG,
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10
      },
      margin: [0, 0, 0, 10]
    }
  ]

  if ((payload.descuentoPorcentualTotal || 0) > 0) {
    content.push(card(null, [
      {
        text: [
          { text: '¿Te gustó la simulación? ', bold: true },
          { text: `Podrías estudiar con hasta un ${payload.descuentoPorcentualTotal}% de descuento. ` },
          { text: 'Para obtener información personalizada sobre tu beneficio, escríbenos a ' },
          { text: 'admision@uniacc.cl', bold: true, color: BRAND },
          { text: ' o llámanos al ' },
          { text: '+56 22 640 6100', bold: true }
        ],
        fontSize: 9,
        lineHeight: 1.35
      }
    ], { fill: '#F8FAFC' }))
  }

  if ((payload.becasInternas?.length || 0) > 0) {
    content.push({
      text: 'Becas Aplicadas',
      style: 'sectionTitle',
      margin: [0, 6, 0, 6]
    })
    content.push({
      text: 'Beneficios Internos (UNIACC)',
      style: 'subsectionTitle',
      margin: [0, 0, 0, 6]
    })

    for (const beca of payload.becasInternas || []) {
      const descuentoLabel = beca.tipoDescuento === 'monto_fijo'
        ? money(beca.montoDescuento)
        : `${beca.descuentoAplicado ?? 0}%`

      content.push(card(null, [
        { text: beca.nombre || 'Beca', bold: true, fontSize: 11, color: BRAND, margin: [0, 0, 0, 2] },
        {
          text: [beca.procesoEvaluacion, beca.tipoDescuento].filter(Boolean).join(' • ') || 'Beneficio interno',
          fontSize: 8,
          color: MUTED,
          margin: [0, 0, 0, 6]
        },
        {
          columns: [
            { text: `Descuento: ${descuentoLabel}`, fontSize: 9, bold: true },
            { text: `Aplicado: -${money(beca.montoDescuento)}`, fontSize: 9, bold: true, alignment: 'right', color: GREEN_DARK }
          ]
        }
      ], { fill: '#F0FDF4', margin: [0, 0, 0, 8] }))
    }
  }

  return {
    pageSize: 'A4',
    pageMargins: [36, 36, 36, 40],
    images: {
      uniaccLogo: UNIACC_LOGO_DATA_URL
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#0F172A'
    },
    styles: {
      header: {
        fontSize: 16,
        bold: true,
        color: BRAND
      },
      subheader: {
        fontSize: 9,
        color: MUTED
      },
      cardTitle: {
        fontSize: 11,
        bold: true,
        color: BRAND
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: BRAND
      },
      subsectionTitle: {
        fontSize: 10,
        bold: true,
        color: BRAND
      },
      careerName: {
        fontSize: 13,
        bold: true,
        color: '#0F172A'
      },
      fieldLabel: {
        fontSize: 8,
        color: MUTED,
        margin: [0, 0, 0, 2]
      },
      fieldValue: {
        fontSize: 10,
        bold: true
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: '#FFFFFF'
      },
      tableRow: {
        fontSize: 9
      },
      tableRowBold: {
        fontSize: 9,
        bold: true
      },
      note: {
        fontSize: 8,
        color: MUTED,
        italics: true,
        lineHeight: 1.3
      }
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Universidad UNIACC  •  Página ${currentPage} de ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: MUTED,
      margin: [36, 0, 36, 20]
    }),
    content
  }
}

export function downloadSimulacionPdf(
  definition: Record<string, unknown>,
  filename: string
): void {
  ensurePdfMakeVfs()
  pdfMake.createPdf(definition as never).download(filename)
}

export function exportSimulacionPdf(payload: SimulacionPdfPayload): string {
  const filename = buildSimulacionPdfFilename({
    nombre: payload.nombre,
    apellido: payload.apellido,
    carrera: payload.carreraNombre,
    date: payload.fecha
  })
  const definition = buildSimulacionPdfDefinition(payload)
  downloadSimulacionPdf(definition, filename)
  return filename
}
