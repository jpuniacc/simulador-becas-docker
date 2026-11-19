import { useSimuladorStore } from '@/stores/simuladorStore'
import { trackSimulacionExitosa, linkSimulacionExitosa, trackRegistroConfirmadoServidor } from '@/utils/analytics'
import type { FormData } from '@/types/simulador'
import type { Carrera } from '@/stores/carrerasStore'
import { useProspectos } from '@/composables/useProspectos'
import { useCRM } from '@/composables/useCRM'

/**
 * Registro del lead al entrar al resumen de pregrado.
 *
 * Es una extracción literal del bloque que hace `Results.handleSimulate` después de
 * `simuladorStore.simulate()`: mismo orden, mismas llamadas y mismos datos. Se mueve a un
 * composable para poder probar que se dispara UNA sola vez y para que el resumen nuevo no
 * dependa de `Results.vue` (que sigue usándose en /advance, /postgrados y /diplomados).
 */
export function useRegistroSimulacion() {
  const simuladorStore = useSimuladorStore()
  const { insertarProspecto } = useProspectos()
  const { enviarCRM, createJSONcrm } = useCRM()

  const registrarLead = async (opts: {
    segmentacion: string
    carreraInfo: Carrera | null | undefined
    becasAplicadas: Array<{ beca?: { nombre?: string | null } }>
  }): Promise<void> => {
    const { segmentacion, carreraInfo, becasAplicadas } = opts

    // GTM + BD: solo tras simulación exitosa (fallos CRM/prospecto no bloquean el evento)
    const analyticsEventId = await trackSimulacionExitosa({
      segmentacion,
      carrera: simuladorStore.formData.carrera
    })

    const userAgent = navigator.userAgent
    const becaNombre = becasAplicadas?.[0]?.beca?.nombre
      ? String(becasAplicadas[0].beca!.nombre)
      : null

    // Enviar a HubSpot (único CRM)
    let respuestaCRM: any = null
    try {
      respuestaCRM = await enviarCRM(
        simuladorStore.formData as FormData,
        carreraInfo,
        userAgent,
        { segmentacion, becaNombre }
      )
    } catch (error) {
      console.warn('[HubSpot] No se pudo enviar:', error)
    }

    const crmJson = respuestaCRM?._prospectoPayload
      || createJSONcrm(simuladorStore.formData as FormData, carreraInfo, userAgent)

    // Guardar el prospecto con la respuesta del CRM (si existe)
    let prospectoGuardado: any = null
    try {
      prospectoGuardado = await insertarProspecto(
        simuladorStore.formData as FormData,
        segmentacion,
        becasAplicadas as any,
        crmJson,
        respuestaCRM
      )
    } catch (error) {
      console.warn('[Prospecto] No se pudo guardar:', error)
    }

    // GTM: registro confirmado en servidor (HubSpot y/o prospecto persistido)
    if (prospectoGuardado?.id || (respuestaCRM && !respuestaCRM.skipped && respuestaCRM.hubspot_contact_id)) {
      trackRegistroConfirmadoServidor({
        segmentacion,
        carrera: simuladorStore.formData.carrera,
        prospectoId: prospectoGuardado?.id ?? null,
        hubspotContactId: respuestaCRM?.hubspot_contact_id
          || respuestaCRM?.id
          || prospectoGuardado?.hubspot_contact_id
          || null,
        crmProvider: 'hubspot'
      })
    } else {
      console.warn('[GTM] registro_confirmado_servidor NO disparado', {
        prospectoId: prospectoGuardado?.id ?? null,
        respuestaCRM
      })
    }

    // Persistir simulación completa en tabla simulaciones (validez 7 días)
    // (se conserva tal cual estaba en Results)
    let simulacionId: string | null = null
    if (prospectoGuardado?.id && (simuladorStore as any).simulation?.value?.saveSimulation) {
      try {
        simulacionId = await (simuladorStore as any).simulation.value.saveSimulation(prospectoGuardado.id)
      } catch (error) {
        console.warn('No se pudo guardar la simulación:', error)
      }
    }

    // Vincular evento analytics con prospecto y simulación (si existen)
    if (analyticsEventId) {
      await linkSimulacionExitosa(analyticsEventId, {
        prospectoId: prospectoGuardado?.id,
        simulacionId
      })
    }
  }

  return { registrarLead }
}
