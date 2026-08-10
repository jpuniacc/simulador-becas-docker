import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type EventoAnalyticsInsert = Database['public']['Tables']['eventos_analytics']['Insert']
type EventoAnalyticsUpdate = Database['public']['Tables']['eventos_analytics']['Update']

export async function persistSimulacionExitosaEvent(
  payload: Omit<EventoAnalyticsInsert, 'event_name'>
): Promise<string | null> {
  const { data, error } = await supabase
    .from('eventos_analytics')
    .insert({
      event_name: 'simulacion_exitosa',
      ...payload
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data?.id ?? null
}

export async function linkSimulacionExitosaEvent(
  eventId: string,
  links: { prospectoId?: string | null; simulacionId?: string | null }
): Promise<void> {
  const updates: EventoAnalyticsUpdate = {}

  if (links.prospectoId) {
    updates.prospecto_id = links.prospectoId
  }
  if (links.simulacionId) {
    updates.simulacion_id = links.simulacionId
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  const { error } = await supabase
    .from('eventos_analytics')
    .update(updates)
    .eq('id', eventId)

  if (error) {
    throw error
  }
}
