import type { Database } from '@/types/supabase'

type CarreraRow = Database['public']['Tables']['carreras_uniacc']['Row']

/** Año académico de consulta (= año calendario de sysdate). */
export function anioConsultaArancel(fecha: Date = new Date()): number {
  return fecha.getFullYear()
}

/**
 * Carrera visible en "Carrera de Interés":
 * tiene arancel > 0 para el año en curso o el año siguiente (sysdate).
 */
export function carreraTieneArancelAnioActual(
  carrera: Pick<CarreraRow, 'arancel' | 'anio'>,
  anio: number = anioConsultaArancel(),
): boolean {
  const monto = Number(carrera.arancel ?? 0)
  if (!(monto > 0)) return false
  if (carrera.anio == null) return false
  const anioCarrera = Number(carrera.anio)
  return anioCarrera === anio || anioCarrera === anio + 1
}
