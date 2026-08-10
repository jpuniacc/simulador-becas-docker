<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import FloatLabel from 'primevue/floatlabel'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import OverlayPanel from 'primevue/overlaypanel'
import DatePicker from 'primevue/datepicker'
import SchoolSelectionModal from '@/components/modals/SchoolSelectionModal.vue'
import type { FormData } from '@/types/simulador'
import type { Region, Comuna, Colegio } from '@/composables/useColegios'
import { School, Shield } from 'lucide-vue-next'
import { validateEmail, validateRUT } from '@/utils/validation'
import { formatRUT, cleanRUT } from '@/utils/formatters'

// Props
interface Props {
    formData?: Partial<FormData>
    modo?: 'primera_carrera' | 'especializacion' | 'postgrado'
}

const props = withDefaults(defineProps<Props>(), {
    formData: () => ({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        nivelEducativo: '' as FormData['nivelEducativo'],
        regionResidencia: '',
        comunaResidencia: '',
        colegio: '',
        consentimiento_contacto: false
    }),
    modo: 'primera_carrera'
})

// Emits
const emit = defineEmits<{
    'update:form-data': [data: Partial<FormData>]
    'validation-change': [isValid: boolean]
}>()

// Opciones de nivel educativo
const opcionesNivelEducativo = [
    { label: 'Educación media incompleta', value: 'Educación media incompleta' },
    { label: 'Educación media completa', value: 'Educación media completa' },
    { label: 'Educación superior incompleta', value: 'Educación superior incompleta' },
    { label: 'Educación superior completa', value: 'Educación superior completa' }
]

// Estado del modal de selección de colegio
const isSchoolModalOpen = ref(false)
const selectedRegion = ref<Region | null>(null)
const selectedComuna = ref<Comuna | null>(null)
const selectedColegio = ref<Colegio | null>(null)

// Refs para el OverlayPanel de información de extranjero
const extranjeroInfoPanelRef = ref<InstanceType<typeof OverlayPanel> | null>(null)
const extranjeroInfoIconRef = ref<HTMLElement | null>(null)

// Refs para el OverlayPanel de información de nivel educativo
const nivelEducativoInfoPanelRef = ref<InstanceType<typeof OverlayPanel> | null>(null)
const nivelEducativoInfoIconRef = ref<HTMLElement | null>(null)

// Detectar si es un dispositivo móvil
const isMobile = ref(false)

const handleMobileResize = () => {
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth <= 768
    isMobile.value = hasTouchSupport && isSmallScreen
}

onMounted(() => {
    // Consentimiento siempre true: avisar al padre
    emit('update:form-data', { consentimiento_contacto: true })
    // Detectar si es móvil basándose en touch support y tamaño de pantalla
    handleMobileResize()
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleMobileResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleMobileResize)
})

// Estado local del formulario
const formData = ref<Partial<FormData>>({
    nombre: props.formData?.nombre || '',
    apellido: props.formData?.apellido || '',
    email: props.formData?.email || '',
    telefono: props.formData?.telefono || '',
    identificacion: props.formData?.identificacion || '',
    tipoIdentificacion: props.formData?.tipoIdentificacion || 'rut',
    tieneRUT: props.formData?.tieneRUT !== undefined ? props.formData.tieneRUT : true,
    extranjero: props.formData?.extranjero !== undefined ? props.formData.extranjero : false,
    residencia_chilena: props.formData?.residencia_chilena !== undefined ? props.formData.residencia_chilena : true,
    nivelEducativo: props.formData?.nivelEducativo || '',
    regionResidencia: props.formData?.regionResidencia || '',
    comunaResidencia: props.formData?.comunaResidencia || '',
    colegio: props.formData?.colegio || '',
    añoEgreso: props.formData?.añoEgreso || '',
    ranking: props.formData?.ranking || null,
    nem: props.formData?.nem || null,
    anio_nacimiento: props.formData?.anio_nacimiento || null,
        consentimiento_contacto: true
})

// Computed para verificar si es egresado (completó educación media)
const isEgresado = computed(() => {
    const nivel = formData.value.nivelEducativo
    return nivel === 'Educación media completa' ||
           nivel === 'Educación superior incompleta' ||
           nivel === 'Educación superior completa'
})

// Computed para verificar si se debe mostrar RUT o Pasaporte
const mostrarRUT = computed(() => {
    return formData.value.tieneRUT !== false
})

const mostrarPasaporte = computed(() => {
    return formData.value.tieneRUT === false && formData.value.tipoIdentificacion === 'pasaporte'
})

// Computed para el checkbox de extranjero
const esExtranjero = computed({
    get: () => formData.value.extranjero === true,
    set: (value: boolean) => {
        formData.value.extranjero = value
        if (value) {
            cambiarAPasaporte()
        } else {
            volverARUT()
        }
    }
})

// Computed para el checkbox de residencia fuera del país
// Si está marcado, significa que NO reside en Chile (residencia_chilena = false)
const resideFueraPais = computed({
    get: () => formData.value.residencia_chilena === false,
    set: (value: boolean) => {
        formData.value.residencia_chilena = !value
    }
})

// Computed para manejar valores null en año de egreso
const añoEgresoValue = computed({
    get: () => formData.value.añoEgreso ? Number(formData.value.añoEgreso) : null,
    set: (value: number | null) => {
        formData.value.añoEgreso = value ? value.toString() : ''
    }
})

// Computed para manejar valores null en ranking
const rankingValue = computed({
    get: () => formData.value.ranking ?? null,
    set: (value: number | null) => {
        formData.value.ranking = value
    }
})

// Computed para manejar el año de nacimiento (Calendar devuelve Date, necesitamos extraer el año)
const anioNacimientoValue = computed({
    get: () => {
        if (formData.value.anio_nacimiento !== null && formData.value.anio_nacimiento !== undefined) {
            // Crear una fecha con el año seleccionado
            return new Date(formData.value.anio_nacimiento, 0, 1)
        }
        return null
    },
    set: (value: Date | null) => {
        if (value instanceof Date && !isNaN(value.getTime())) {
            formData.value.anio_nacimiento = value.getFullYear()
        } else {
            formData.value.anio_nacimiento = null
        }
    }
})

// Constantes para el rango de años de nacimiento
const anioMinimo = 1900
const anioActual = new Date().getFullYear() - 15 // solo mayores de 15 años
const minDate = new Date(anioMinimo, 0, 1) // 1 de enero del año mínimo
const maxDate = new Date(anioActual, 11, 31) // 31 de diciembre del año actual
const yearRange = `${anioMinimo}:${anioActual}` // Rango de años para ocultar los que están fuera

// Estado local para el valor del input NEM (string) - mantiene el estado del input sin convertir a número
const nemInputValue = ref('')

// Flag para prevenir que el watcher interfiera mientras el usuario escribe
const isUserTyping = ref(false)

// Watcher para sincronizar desde formData al input (solo cuando viene de fuera, no mientras el usuario escribe)
watch(() => formData.value.nem, (newValue, oldValue) => {
    // No actualizar si el usuario está escribiendo
    if (isUserTyping.value) {
        return
    }

    if (newValue !== null && newValue !== undefined) {
        const formatted = newValue.toFixed(1).replace('.', ',')
        // Solo actualizar si es diferente y no es un valor parcial que el usuario está escribiendo
        if (nemInputValue.value !== formatted && !nemInputValue.value.endsWith(',')) {
            nemInputValue.value = formatted
        }
    } else if (nemInputValue.value !== '' && !nemInputValue.value.endsWith(',')) {
        // Si formData se limpia, limpiar también el input (pero no si el usuario está escribiendo "X,")
        nemInputValue.value = ''
    }
}, { immediate: true })

// Computed para manejar valores null en NEM (como string para la máscara)
const nemValue = computed({
    get: () => {
        return nemInputValue.value
    },
    set: (value: string) => {
        // Actualizar el valor del input local
        nemInputValue.value = value

        // Solo convertir a número si el formato está completo (X,X con ambos dígitos)
        if (!value || value.trim() === '') {
            formData.value.nem = null
            return
        }

        // Verificar que tenga formato completo X,X (con dígito después de la coma)
        const parts = value.split(',')
        if (parts.length === 2 && parts[0] && parts[1] && parts[1].length > 0) {
            // Convertir string con formato X,X a número
            const numValue = parseFloat(value.replace(',', '.'))
            if (!isNaN(numValue)) {
                // Validar rango 1.0 - 7.0
                formData.value.nem = Math.max(1.0, Math.min(7.0, numValue))
            }
        } else {
            // Si el formato no está completo (ej: "5," sin segundo dígito), no convertir a número
            // Mantener formData como está o limpiarlo si estaba vacío
            if (value === '' || value === ',') {
                formData.value.nem = null
            }
            // Si tiene "X," pero no el segundo dígito, no actualizar formData
        }
    }
})

// Función para manejar el input del NEM con máscara personalizada
const handleNEMInput = (event: Event) => {
    isUserTyping.value = true
    const target = event.target as HTMLInputElement
    let value = target.value

    // Remover todo excepto dígitos y coma
    value = value.replace(/[^0-9,]/g, '')

    // Si está vacío, permitir
    if (value === '') {
        nemValue.value = ''
        return
    }

    // Contar comas
    const comaCount = (value.match(/,/g) || []).length

    // Si hay más de una coma, mantener solo la primera
    if (comaCount > 1) {
        const firstComaIndex = value.indexOf(',')
        value = value.slice(0, firstComaIndex + 1) + value.slice(firstComaIndex + 1).replace(/,/g, '')
    }

    // Dividir por la coma
    const parts = value.split(',')
    const beforeComa = parts[0] || ''
    const afterComa = parts[1] || ''

    // Limpiar y validar parte antes de la coma (solo dígitos 1-7)
    let cleanBefore = beforeComa.replace(/[^0-9]/g, '')
    if (cleanBefore.length > 0) {
        const firstDigit = parseInt(cleanBefore[0])
        if (firstDigit >= 1 && firstDigit <= 7) {
            cleanBefore = cleanBefore[0] // Solo el primer dígito válido
        } else {
            cleanBefore = ''
        }
    }

    // Limpiar y validar parte después de la coma (solo dígitos 0-9, máximo 1 dígito)
    let cleanAfter = afterComa.replace(/[^0-9]/g, '').slice(0, 1)
    if (cleanAfter.length > 0) {
        const secondDigit = parseInt(cleanAfter)
        if (secondDigit < 0 || secondDigit > 9) {
            cleanAfter = ''
        }
    }

    // Construir el valor final
    if (cleanBefore && cleanAfter) {
        value = cleanBefore + ',' + cleanAfter
    } else if (cleanBefore && value.includes(',')) {
        value = cleanBefore + ','
    } else if (cleanBefore) {
        // Si hay un dígito válido pero no hay coma, agregarla automáticamente
        value = cleanBefore + ','
    } else {
        value = ''
    }

    // Actualizar el valor del input directamente sin disparar el setter del computed
    nemInputValue.value = value
    target.value = value

    // Solo actualizar formData si el formato está completo (X,X con segundo dígito)
    const valueParts = value.split(',')
    if (valueParts.length === 2 && valueParts[0] && valueParts[1] && valueParts[1].length > 0) {
        // Formato completo, convertir a número
        const numValue = parseFloat(value.replace(',', '.'))
        if (!isNaN(numValue)) {
            formData.value.nem = Math.max(1.0, Math.min(7.0, numValue))
        }
    } else if (value === '' || value.trim() === '') {
        // Si está vacío, limpiar formData
        formData.value.nem = null
    }
    // Si tiene formato incompleto como "5,", no hacer nada con formData

    // Resetear el flag después de un pequeño delay
    setTimeout(() => {
        isUserTyping.value = false
    }, 100)
}

// Función para manejar keydown y prevenir caracteres inválidos
const handleNEMKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLInputElement
    const currentValue = target.value

    // Permitir teclas de control
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab' ||
        event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' || event.ctrlKey || event.metaKey || event.key === 'Enter') {
        return
    }

    // Si presiona coma, manejarlo en el input
    if (event.key === ',' || event.key === '.') {
        event.preventDefault()
        const cursorPos = target.selectionStart || 0

        // Si no hay coma aún y hay un dígito válido antes
        if (!currentValue.includes(',') && currentValue.length > 0) {
            const firstDigit = parseInt(currentValue[0])
            if (firstDigit >= 1 && firstDigit <= 7) {
                const newValue = currentValue.slice(0, cursorPos) + ',' + currentValue.slice(cursorPos)
                target.value = newValue
                nemValue.value = newValue
                // Mover cursor después de la coma
                setTimeout(() => {
                    target.setSelectionRange(cursorPos + 1, cursorPos + 1)
                }, 0)
            }
        }
        return
    }

    // Si es un número
    if (/[0-9]/.test(event.key)) {
        const cursorPos = target.selectionStart || 0
        const hasComa = currentValue.includes(',')
        const comaPos = currentValue.indexOf(',')

        // Si el cursor está antes de la coma
        if (hasComa && cursorPos <= comaPos) {
            const digit = parseInt(event.key)
            // Solo permitir 1-7 antes de la coma
            if (digit >= 1 && digit <= 7) {
                return // Permitir
            } else {
                event.preventDefault()
            }
        }
        // Si el cursor está después de la coma
        else if (hasComa && cursorPos > comaPos) {
            const digit = parseInt(event.key)
            // Solo permitir 0-9 después de la coma
            if (digit >= 0 && digit <= 9) {
                // Si ya hay un dígito después de la coma, reemplazarlo
                if (currentValue.length > comaPos + 1) {
                    event.preventDefault()
                    const newValue = currentValue.slice(0, cursorPos) + event.key + currentValue.slice(cursorPos + 1)
                    target.value = newValue
                    nemValue.value = newValue
                    target.setSelectionRange(cursorPos + 1, cursorPos + 1)
                }
                return // Permitir
            } else {
                event.preventDefault()
            }
        }
        // Si no hay coma aún
        else {
            const digit = parseInt(event.key)
            // Solo permitir 1-7 como primer dígito
            if (digit >= 1 && digit <= 7) {
                return // Permitir, el input manejará agregar la coma
            } else {
                event.preventDefault()
            }
        }
    } else {
        // Bloquear cualquier otro carácter
        event.preventDefault()
    }
}

// Estado de errores de validación
const emailError = ref<string | null>(null)
const rutError = ref<string | null>(null)
const telefonoError = ref<string | null>(null)

// Estado para controlar cuándo mostrar errores
const submitted = ref(false)
const touched = ref({
    nombre: false,
    apellido: false,
    email: false,
    telefono: false,
    identificacion: false,
    nivelEducativo: false,
    colegio: false,
    anio_nacimiento: false
})

// Validar email cuando cambie
watch(() => formData.value.email, (newEmail) => {
    touched.value.email = true
    if (newEmail && newEmail.trim() !== '') {
        if (!validateEmail(newEmail)) {
            emailError.value = 'Por favor ingresa un email válido'
        } else {
            emailError.value = null
        }
    } else {
        emailError.value = null
    }
})

// Función para cambiar a pasaporte
const cambiarAPasaporte = () => {
    // Guardar el valor del RUT antes de cambiar
    const valorRUT = formData.value.identificacion || ''
    formData.value.tieneRUT = false
    formData.value.tipoIdentificacion = 'pasaporte'
    // Copiar el valor del RUT al campo de pasaporte
    formData.value.identificacion = valorRUT
    rutError.value = null // Limpiar error de RUT
}

// Función para volver a RUT
const volverARUT = () => {
    formData.value.tieneRUT = true
    formData.value.tipoIdentificacion = 'rut'
    formData.value.identificacion = '' // Limpiar el campo al cambiar
    rutError.value = null // Limpiar error de RUT
}

// Funciones para mostrar/ocultar el OverlayPanel de información de extranjero
const showExtranjeroInfo = (event: MouseEvent) => {
    // Ignorar en móvil, solo usar click
    if (isMobile.value) return
    if (extranjeroInfoIconRef.value && extranjeroInfoPanelRef.value) {
        extranjeroInfoPanelRef.value.toggle(event, extranjeroInfoIconRef.value)
    }
}

const hideExtranjeroInfo = () => {
    // Ignorar en móvil, solo usar click
    if (isMobile.value) return
    if (extranjeroInfoPanelRef.value) {
        extranjeroInfoPanelRef.value.hide()
    }
}

const toggleExtranjeroInfo = (event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (extranjeroInfoIconRef.value && extranjeroInfoPanelRef.value) {
        const target = (event.target as HTMLElement) || extranjeroInfoIconRef.value
        extranjeroInfoPanelRef.value.toggle(event as MouseEvent, target)
    }
}

// Funciones para mostrar/ocultar el OverlayPanel de información de nivel educativo
const showNivelEducativoInfo = (event: MouseEvent) => {
    // Ignorar en móvil, solo usar click
    if (isMobile.value) return
    if (nivelEducativoInfoIconRef.value && nivelEducativoInfoPanelRef.value) {
        nivelEducativoInfoPanelRef.value.toggle(event, nivelEducativoInfoIconRef.value)
    }
}

const hideNivelEducativoInfo = () => {
    // Ignorar en móvil, solo usar click
    if (isMobile.value) return
    if (nivelEducativoInfoPanelRef.value) {
        nivelEducativoInfoPanelRef.value.hide()
    }
}

const toggleNivelEducativoInfo = (event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (nivelEducativoInfoIconRef.value && nivelEducativoInfoPanelRef.value) {
        const target = (event.target as HTMLElement) || nivelEducativoInfoIconRef.value
        nivelEducativoInfoPanelRef.value.toggle(event as MouseEvent, target)
    }
}

// Manejar input de RUT con formateo automático
const handleRUTInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const clean = cleanRUT(target.value)
    if (clean.length >= 8) {
        const formatted = formatRUT(target.value)
        if (formatted !== formData.value.identificacion) {
            formData.value.identificacion = formatted
        }
    }
}

// Manejar keydown de teléfono: prevenir letras y caracteres no numéricos
const handlePhoneKeydown = (event: KeyboardEvent) => {
    // Permitir teclas de control (backspace, delete, tab, etc.)
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab' ||
        event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' || event.ctrlKey || event.metaKey) {
        return
    }
    // Solo permitir números
    if (!/[0-9]/.test(event.key)) {
        event.preventDefault()
    }
}

// Manejar paste de teléfono: filtrar solo números
const handlePhonePaste = (event: ClipboardEvent) => {
    event.preventDefault()
    const paste = (event.clipboardData || (window as any).clipboardData).getData('text')
    const numbersOnly = paste.replace(/[^0-9]/g, '').slice(0, 8)
    if (numbersOnly) {
        formData.value.telefono = numbersOnly
    }
}

// Manejar input de teléfono: solo números y máximo 8 dígitos
const handlePhoneInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    // Remover todo lo que no sea número
    const numbersOnly = target.value.replace(/[^0-9]/g, '')
    // Limitar a 8 dígitos
    const limited = numbersOnly.slice(0, 8)
    if (limited !== formData.value.telefono) {
        formData.value.telefono = limited
    }
}

// Validar RUT cuando cambie (solo si tieneRUT es true)
watch(() => formData.value.identificacion, (newRUT) => {
    touched.value.identificacion = true
    if (mostrarRUT.value && newRUT && newRUT.trim() !== '') {
        if (!validateRUT(newRUT)) {
            rutError.value = 'Por favor ingresa un RUT válido'
        } else {
            rutError.value = null
        }
    } else {
        rutError.value = null
    }
})

// Validar teléfono cuando cambie
watch(() => formData.value.telefono, (newPhone) => {
    touched.value.telefono = true
    if (newPhone && newPhone.trim() !== '') {
        // Validar que tenga exactamente 8 dígitos
        const phoneNumbers = newPhone.replace(/[^0-9]/g, '')
        if (phoneNumbers.length !== 8) {
            telefonoError.value = 'El teléfono debe tener 8 dígitos'
        } else {
            telefonoError.value = null
        }
    } else {
        telefonoError.value = null
    }
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
    const isEspecializacion = props.modo === 'postgrado'

    const hasRequiredFields =
        formData.value.nombre?.trim() !== '' &&
        formData.value.apellido?.trim() !== '' &&
        formData.value.email?.trim() !== '' &&
        formData.value.telefono?.trim() !== '' &&
        formData.value.identificacion?.trim() !== '' &&
        formData.value.anio_nacimiento !== null &&
        // Nivel educativo solo es requerido si NO es especialización
        (isEspecializacion || formData.value.nivelEducativo !== '') &&
        // Colegio solo es requerido si NO usa pasaporte Y NO es especialización
        (isEspecializacion || mostrarPasaporte.value || formData.value.colegio?.trim() !== '')

    const isEmailValid = formData.value.email ? validateEmail(formData.value.email) : false
    // Validar RUT solo si tieneRUT es true, si es pasaporte solo verificar que no esté vacío
    const isRUTValid = mostrarRUT.value
        ? (formData.value.identificacion ? validateRUT(formData.value.identificacion) : false)
        : (formData.value.identificacion?.trim() !== '') // Para pasaporte solo verificar que no esté vacío
    const isPhoneValid = formData.value.telefono ? formData.value.telefono.replace(/[^0-9]/g, '').length === 8 : false

    return hasRequiredFields && isEmailValid && isRUTValid && isPhoneValid && !emailError.value && !rutError.value && !telefonoError.value
})

// Emitir cambios de validación
watch(isFormValid, (newValue) => {
    emit('validation-change', newValue)
}, { immediate: true })

// Función para marcar el formulario como submitted (cuando se intenta avanzar)
const markAsSubmitted = () => {
    submitted.value = true
    // Marcar todos los campos como touched
    Object.keys(touched.value).forEach(key => {
        touched.value[key as keyof typeof touched.value] = true
    })
}

// Método para procesar RUT desde el componente padre (formateo y validación)
const processRUT = (rutValue: string) => {
    if (!rutValue || !rutValue.trim()) return

    // Limpiar y formatear el RUT
    const clean = cleanRUT(rutValue)
    if (clean.length >= 8) {
        const formatted = formatRUT(rutValue)
        formData.value.identificacion = formatted
    } else {
        formData.value.identificacion = rutValue
    }

    // Marcar como touched para disparar validaciones
    touched.value.identificacion = true

    // Validar el RUT
    if (mostrarRUT.value && formData.value.identificacion && formData.value.identificacion.trim() !== '') {
        if (!validateRUT(formData.value.identificacion)) {
            rutError.value = 'Por favor ingresa un RUT válido'
        } else {
            rutError.value = null
        }
    }

    // Emitir el cambio
    emit('update:form-data', {
        identificacion: formData.value.identificacion
    })
}

// Exponer el estado de validación al componente padre
defineExpose({
    isFormValid,
    emailError,
    markAsSubmitted,
    processRUT
})

// Métodos del modal
const openSchoolModal = () => {
    isSchoolModalOpen.value = true
}

const handleSchoolSelectionComplete = (region: Region, comuna: Comuna, colegio: Colegio) => {
    selectedRegion.value = region
    selectedComuna.value = comuna
    selectedColegio.value = colegio

    // Actualizar formData con la información del colegio
    formData.value.colegio = colegio.nombre
    formData.value.regionResidencia = colegio.region_nombre || region.region_nombre
    formData.value.comunaResidencia = colegio.comuna_nombre || comuna.comuna_nombre
    touched.value.colegio = true

    isSchoolModalOpen.value = false
}

// Flag para prevenir ciclos infinitos entre watchers
const isUpdatingFromProps = ref(false)

// Watcher para emitir cambios
watch(formData, (newData) => {
    // Solo emitir si no estamos actualizando desde props
    if (!isUpdatingFromProps.value) {
        emit('update:form-data', { ...newData })
    }
}, { deep: true })

// Watcher para actualizar cuando cambien las props
watch(() => props.formData, (newData) => {
    if (newData) {
        // Verificar si hay cambios reales antes de actualizar
        const hasChanges =
            formData.value.nombre !== (newData.nombre || '') ||
            formData.value.apellido !== (newData.apellido || '') ||
            formData.value.email !== (newData.email || '') ||
            formData.value.telefono !== (newData.telefono || '') ||
            formData.value.identificacion !== (newData.identificacion || '') ||
            formData.value.tipoIdentificacion !== (newData.tipoIdentificacion || 'rut') ||
            formData.value.tieneRUT !== (newData.tieneRUT !== undefined ? newData.tieneRUT : true) ||
            formData.value.extranjero !== (newData.extranjero !== undefined ? newData.extranjero : false) ||
            formData.value.residencia_chilena !== (newData.residencia_chilena !== undefined ? newData.residencia_chilena : true) ||
            formData.value.nivelEducativo !== (newData.nivelEducativo || '') ||
            formData.value.regionResidencia !== (newData.regionResidencia || '') ||
            formData.value.comunaResidencia !== (newData.comunaResidencia || '') ||
            formData.value.colegio !== (newData.colegio || '') ||
            formData.value.añoEgreso !== (newData.añoEgreso || '') ||
            formData.value.ranking !== (newData.ranking || null) ||
            formData.value.nem !== (newData.nem || null) ||
            formData.value.anio_nacimiento !== (newData.anio_nacimiento || null) ||
            formData.value.consentimiento_contacto !== true

        if (hasChanges) {
            isUpdatingFromProps.value = true
            formData.value = {
                nombre: newData.nombre || '',
                apellido: newData.apellido || '',
                email: newData.email || '',
                telefono: newData.telefono || '',
                identificacion: newData.identificacion || '',
                tipoIdentificacion: newData.tipoIdentificacion || 'rut',
                tieneRUT: newData.tieneRUT !== undefined ? newData.tieneRUT : true,
                extranjero: newData.extranjero !== undefined ? newData.extranjero : false,
                residencia_chilena: newData.residencia_chilena !== undefined ? newData.residencia_chilena : true,
                nivelEducativo: newData.nivelEducativo || '',
                regionResidencia: newData.regionResidencia || '',
                comunaResidencia: newData.comunaResidencia || '',
                colegio: newData.colegio || '',
                añoEgreso: newData.añoEgreso || '',
                ranking: newData.ranking || null,
                nem: newData.nem || null,
                anio_nacimiento: newData.anio_nacimiento || null,
                consentimiento_contacto: true
            }
            // Resetear el flag después de un pequeño delay
            setTimeout(() => {
                isUpdatingFromProps.value = false
            }, 0)
        }
    }
}, { deep: true })

// Watcher para limpiar campos de egresado si cambia el nivel educativo
watch(() => formData.value.nivelEducativo, (newNivel) => {
    const nivelesCompletos = ['Educación media completa', 'Educación superior incompleta', 'Educación superior completa']
    if (!nivelesCompletos.includes(newNivel || '')) {
        formData.value.añoEgreso = ''
        formData.value.ranking = null
        formData.value.nem = null
    }
})
</script>

<template>
    <div class="step1-container">
        <div class="form-guide">
            <p class="guide-text">
                Cuéntanos un poco sobre ti{{ props.modo !== 'especializacion' ? ' y tus estudios' : '' }}
            </p>
        </div>
        <form class="personal-form" @submit.prevent>
            <div class="form-grid">
                <!-- Campo Nombre -->
                <div class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <InputText
                                id="nombre"
                                v-model="formData.nombre"
                                class="form-input"
                                :invalid="(submitted || touched.nombre) && (!formData.nombre || formData.nombre.trim() === '')"
                                @blur="touched.nombre = true"
                            />
                            <label for="nombre">Nombre *</label>
                        </FloatLabel>
                        <Message
                            v-if="(submitted || touched.nombre) && (!formData.nombre || formData.nombre.trim() === '')"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            Nombre es requerido
                        </Message>
                    </div>
                </div>

                <!-- Campo Apellido -->
                <div class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <InputText
                                id="apellido"
                                v-model="formData.apellido"
                                class="form-input"
                                :invalid="(submitted || touched.apellido) && (!formData.apellido || formData.apellido.trim() === '')"
                                @blur="touched.apellido = true"
                            />
                            <label for="apellido">Apellido *</label>
                        </FloatLabel>
                        <Message
                            v-if="(submitted || touched.apellido) && (!formData.apellido || formData.apellido.trim() === '')"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            Apellido es requerido
                        </Message>
                    </div>
                </div>

                <!-- Campo Email -->
                <div class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <InputText
                                id="email"
                                v-model="formData.email"
                                type="email"
                                class="form-input"
                                :invalid="(submitted || touched.email) && (emailError !== null || (formData.email && !validateEmail(formData.email)))"
                                @blur="touched.email = true"
                            />
                            <label for="email">Email *</label>
                        </FloatLabel>
                        <Message
                            v-if="(submitted || touched.email) && (emailError || (formData.email && !validateEmail(formData.email)))"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            {{ emailError || 'Email no es válido' }}
                        </Message>
                    </div>
                </div>

                <!-- Campo Teléfono -->
                <div class="form-field">
                    <div class="flex flex-col gap-1">
                        <InputGroup class="form-input-group">
                            <InputGroupAddon>+569</InputGroupAddon>
                            <FloatLabel>
                                <InputText
                                    id="telefono"
                                    v-model="formData.telefono"
                                    type="tel"
                                    class="form-input"
                                    maxlength="8"
                                    :invalid="(submitted || touched.telefono) && (telefonoError !== null || (formData.telefono && formData.telefono.replace(/[^0-9]/g, '').length !== 8))"
                                    @keydown="handlePhoneKeydown"
                                    @paste="handlePhonePaste"
                                    @input="handlePhoneInput"
                                    @blur="touched.telefono = true"
                                />
                                <label for="telefono">Teléfono *</label>
                            </FloatLabel>
                        </InputGroup>
                        <Message
                            v-if="(submitted || touched.telefono) && (telefonoError || (formData.telefono && formData.telefono.replace(/[^0-9]/g, '').length !== 8))"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            {{ telefonoError || 'El teléfono debe tener 8 dígitos' }}
                        </Message>
                    </div>
                </div>

                <!-- Campo RUT (solo si tieneRUT es true) -->
                <div v-if="mostrarRUT" class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <InputText
                                id="identificacion"
                                v-model="formData.identificacion"
                                type="text"
                                placeholder="12.345.678-9"
                                class="form-input"
                                :invalid="(submitted || touched.identificacion) && (rutError !== null || (formData.identificacion && !validateRUT(formData.identificacion)))"
                                @input="handleRUTInput"
                                @blur="touched.identificacion = true"
                            />
                            <label for="identificacion">RUT *</label>
                        </FloatLabel>
                        <Message
                            v-if="(submitted || touched.identificacion) && (rutError || (formData.identificacion && !validateRUT(formData.identificacion)))"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            {{ rutError || 'RUT no es válido' }}
                        </Message>
                    </div>
                </div>

                <!-- Campo Pasaporte (solo si tieneRUT es false y tipoIdentificacion es pasaporte y NO es especialización) -->
                <div v-if="mostrarPasaporte && props.modo !== 'especializacion'" class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <InputText
                                id="identificacion"
                                v-model="formData.identificacion"
                                type="text"
                                placeholder="Rut provisorio/Pasaporte/DNI"
                                class="form-input"
                                :invalid="(submitted || touched.identificacion) && (!formData.identificacion || formData.identificacion.trim() === '')"
                                @blur="touched.identificacion = true"
                            />
                            <label for="identificacion">Identificación *</label>
                        </FloatLabel>
                        <Message
                            v-if="(submitted || touched.identificacion) && (!formData.identificacion || formData.identificacion.trim() === '')"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            Identificación es requerida
                        </Message>
                    </div>
                </div>

                <!-- Campo Año de Nacimiento -->
                <div class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <DatePicker
                                id="anio_nacimiento"
                                v-model="anioNacimientoValue"
                                view="year"
                                dateFormat="yy"
                                class="form-input w-full"
                                :invalid="(submitted || touched.anio_nacimiento) && formData.anio_nacimiento === null"
                                :minDate="minDate"
                                :maxDate="maxDate"
                                :yearRange="yearRange"
                                @blur="touched.anio_nacimiento = true"
                            />
                            <label for="anio_nacimiento">Año de Nacimiento *</label>
                        </FloatLabel>
                        <Message
                            v-if="(submitted || touched.anio_nacimiento) && formData.anio_nacimiento === null"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            Año de nacimiento es requerido
                        </Message>
                    </div>
                </div>



                 <!-- Checkbox ¿Eres extranjero? (solo para primera carrera) -->
                 <div v-if="props.modo !== 'especializacion'" class="form-field">
                    <div class="flex items-end gap-2">
                        <Checkbox
                            id="esExtranjero"
                            v-model="esExtranjero"
                            :binary="true"
                        />
                        <label
                            for="esExtranjero"
                            class="text-gray-500 dark:text-slate-300 text-sm cursor-pointer"
                            @click="esExtranjero = !esExtranjero"
                        >
                            ¿Eres extranjero?
                        </label>
                        <i
                            ref="extranjeroInfoIconRef"
                            class="pi pi-info-circle text-gray-500 dark:text-slate-400 text-xs cursor-help hover:text-gray-700 dark:hover:text-slate-200"
                            @mouseenter="!isMobile && showExtranjeroInfo($event)"
                            @mouseleave="!isMobile && hideExtranjeroInfo()"
                            @click="toggleExtranjeroInfo"
                        ></i>
                    </div>
                    <OverlayPanel ref="extranjeroInfoPanelRef" class="custom-tooltip-panel">
                        <div class="custom-tooltip">
                            <p>Tenemos beneficios asociados a país de origen</p>
                        </div>
                    </OverlayPanel>
                </div>

                <!-- Checkbox ¿Resides fuera del país? (solo si es extranjero y NO es especialización) -->
                <div v-if="esExtranjero && props.modo !== 'especializacion'" class="form-field">
                    <div class="flex items-end gap-2">
                        <Checkbox
                            id="resideFueraPais"
                            v-model="resideFueraPais"
                            :binary="true"
                        />
                        <label
                            for="resideFueraPais"
                            class="text-gray-500 dark:text-slate-300 text-sm cursor-pointer"
                            @click="resideFueraPais = !resideFueraPais"
                        >
                            ¿Resides fuera del país?
                        </label>
                    </div>
                </div>



                <!-- Campo Nivel Educativo (solo para primera carrera) -->
                <div v-if="props.modo === 'primera_carrera'" class="form-field nivel-educativo-field">
                    <div class="flex flex-col gap-1">
                        <label for="nivelEducativo" class="nivel-educativo-label">
                            Nivel Educativo *
                            <i
                                ref="nivelEducativoInfoIconRef"
                                class="pi pi-question-circle nivel-educativo-icon"
                                @mouseenter="!isMobile && showNivelEducativoInfo($event)"
                                @mouseleave="!isMobile && hideNivelEducativoInfo()"
                                @click="toggleNivelEducativoInfo"
                            ></i>
                        </label>
                        <div class="nivel-educativo-checkboxes">
                            <div
                                v-for="opcion in opcionesNivelEducativo"
                                :key="opcion.value"
                                class="checkbox-option"
                            >
                                <Checkbox
                                    :id="`nivelEducativo-${opcion.value}`"
                                    :binary="true"
                                    :modelValue="formData.nivelEducativo === opcion.value"
                                    @update:modelValue="(checked) => { formData.nivelEducativo = checked ? (opcion.value as FormData['nivelEducativo']) : ''; touched.nivelEducativo = true; }"
                                />
                                <label
                                    :for="`nivelEducativo-${opcion.value}`"
                                    class="checkbox-label"
                                    @click="formData.nivelEducativo = formData.nivelEducativo === opcion.value ? '' : (opcion.value as FormData['nivelEducativo']); touched.nivelEducativo = true"
                                >
                                    {{ opcion.label }}
                                </label>
                            </div>
                        </div>
                        <Message
                            v-if="(submitted || touched.nivelEducativo) && !formData.nivelEducativo"
                            severity="error"
                            variant="simple"
                            size="small"
                        >
                            Nivel educativo es requerido
                        </Message>
                    </div>
                    <OverlayPanel ref="nivelEducativoInfoPanelRef" class="custom-tooltip-panel">
                        <div class="custom-tooltip">
                            <p>Si corresponde, te solicitaremos datos relacionados a egreso de enseñanza media</p>
                        </div>
                    </OverlayPanel>
                </div>

                <!-- Campos de egresado (solo si NO es postgrado) -->
                <template v-if="props.modo !== 'postgrado'">
                    <!-- Año de Egreso (solo para egresados) -->
                     <!-- JPS: Agregar validación para que no se muestre si es extranjero y reside fuera del país -->
                    <div v-if="isEgresado" class="form-field">
                        <FloatLabel>
                            <InputNumber id="añoEgreso" v-model="añoEgresoValue" :min="2000" :max="2025"
                                :useGrouping="false" class="form-input" />
                            <label for="añoEgreso">Año de Egreso (Opcional)</label>
                        </FloatLabel>
                    </div>

                    <!-- JPS: Ranking de Notas (solo para egresados y NO extranjero que reside fuera del país) -->
                    <!-- Modificación: Ocultar campo Ranking cuando es extranjero y reside fuera del país -->
                    <!-- Funcionamiento: Se muestra solo si es egresado Y no es el caso que (es extranjero Y reside fuera del país) -->
                    <div v-if="isEgresado && !(esExtranjero && resideFueraPais)" class="form-field">
                        <FloatLabel>
                            <InputNumber id="ranking" v-model="rankingValue" :min="0" :max="1000" :useGrouping="false"
                                class="form-input" />
                            <label for="ranking">Ranking de Notas (Opcional)</label>
                        </FloatLabel>
                    </div>

                    <!-- JPS: NEM (solo para egresados y NO extranjero que reside fuera del país) -->
                    <!-- Modificación: Ocultar campo NEM cuando es extranjero y reside fuera del país -->
                    <!-- Funcionamiento: Se muestra solo si es egresado Y no es el caso que (es extranjero Y reside fuera del país) -->
                    <div v-if="isEgresado && !(esExtranjero && resideFueraPais)" class="form-field">
                        <FloatLabel>
                            <InputText
                                id="nem"
                                v-model="nemValue"
                                class="form-input"
                                placeholder="Ej 5,5"
                                maxlength="3"
                                @input="handleNEMInput"
                                @keydown="handleNEMKeydown"
                            />
                            <label for="nem">NEM (Opcional)</label>
                        </FloatLabel>
                    </div>
                </template>

                <!-- Campo Selección de Colegio (solo si NO usa pasaporte Y es primera carrera Y (no es extranjero O es extranjero pero reside en Chile)) -->
                <template v-if="props.modo !== 'postgrado'">
                    <div v-if="(!esExtranjero || (esExtranjero && !resideFueraPais))" class="form-field colegio-field">
                        <div class="flex flex-col gap-1">
                            <label for="colegio" class="colegio-label">
                                Colegio *
                            </label>
                            <div class="colegio-selection-container">
                                <Button v-if="!formData.colegio" label="Seleccionar Colegio" icon="pi pi-map-marker"
                                    @click="openSchoolModal" class="colegio-button" outlined />
                                <div v-else class="colegio-selected">
                                    <div class="colegio-info">
                                        <School class="colegio-icon" />
                                        <div class="colegio-details">
                                            <div class="colegio-nombre">{{ formData.colegio }}</div>
                                            <div class="colegio-location">
                                                {{ formData.comunaResidencia }}{{ formData.regionResidencia ? `,
                                                ${formData.regionResidencia}` : '' }}
                                            </div>
                                        </div>
                                    </div>
                                    <Button label="Cambiar" icon="pi pi-pencil" @click="openSchoolModal"
                                        class="colegio-change-button colegio-completed" severity="success" text />
                                </div>
                            </div>
                            <Message
                                v-if="(submitted || touched.colegio) && (!formData.colegio || formData.colegio.trim() === '')"
                                severity="error"
                                variant="simple"
                                size="small"
                            >
                                Colegio es requerido
                            </Message>
                        </div>
                    </div>
                </template>

                <!-- Disclaimer de consentimiento (siempre true en formulario) -->
                <div class="form-field consentimiento-field">
                    <div class="consentimiento-wrapper">
                        <span class="consentimiento-asterisco" aria-hidden="true">*</span>
                        <Shield class="consentimiento-icon" aria-hidden="true" />
                        <div class="consentimiento-content">
                            <p class="consentimiento-title">
                                Aceptas que el equipo de admisión de UNIACC te contacte
                                para orientarte sobre programas y resolver tus dudas, usando los datos que ingresaste.
                            </p>
                            <p class="consentimiento-disclaimer">
                                * Solo usamos tus datos con fines de orientación académica.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </form>

        <!-- Modal de Selección de Colegio -->
        <SchoolSelectionModal v-model:isOpen="isSchoolModalOpen" :selected-region="selectedRegion"
            :selected-comuna="selectedComuna" :selected-colegio="selectedColegio"
            @complete="handleSchoolSelectionComplete" />
    </div>
</template>

<style scoped>
@import '@/assets/form-styles.css';

.step1-container {
    @apply form-container;
}

/* Estilos para checkboxes de nivel educativo */
.nivel-educativo-field {
    @apply col-span-1 md:col-span-2;
}

.nivel-educativo-label {
    @apply block text-sm font-medium text-gray-700 mb-3;
    @apply flex items-center gap-2;
}

.nivel-educativo-checkboxes {
    @apply flex flex-col gap-3 ml-5 mb-2;
}

.checkbox-option {
    @apply flex items-center gap-2;
}

.checkbox-label {
    @apply text-sm text-gray-700 cursor-pointer;
    @apply flex-1;
}

.nivel-educativo-icon {
    @apply text-gray-500 cursor-help;
    font-size: 1rem;
    width: 1rem;
    height: 1rem;
    display: inline-block;
    line-height: 1;
    transition: color 0.2s;
}

.nivel-educativo-icon:hover {
    @apply text-gray-700;
}

:global(html.dark) .nivel-educativo-label,
:global(html.dark) .checkbox-label,
:global(html.dark) .colegio-label,
:global(html.dark) .form-label {
    color: #e2e8f0 !important;
}

:global(html.dark) .nivel-educativo-icon {
    color: #94a3b8 !important;
}

:global(html.dark) .nivel-educativo-icon:hover {
    color: #e2e8f0 !important;
}

/* Estilos para selección de colegio */
.colegio-field {
    @apply col-span-1 md:col-span-2;
}

.colegio-label {
    @apply block text-sm font-medium text-gray-700 mb-3;
}

.form-label {
    @apply block text-sm font-medium text-gray-700 mb-2;
}

.colegio-selection-container {
    @apply w-full;
}

:deep(.colegio-button) {
    @apply w-full justify-start;
    border-color: var(--p-primary-500) !important;
    color: var(--p-primary-700) !important;
}

:deep(.colegio-button:hover) {
    background-color: var(--p-primary-100) !important;
    border-color: var(--p-primary-700) !important;
    color: var(--p-primary-900) !important;
}

:global(html.dark) :deep(.colegio-button) {
    color: #93c5fd !important;
    border-color: #3b82f6 !important;
    background-color: #1e293b !important;
}

:global(html.dark) :deep(.colegio-button:hover) {
    background-color: #334155 !important;
    color: #e0f2fe !important;
    border-color: #60a5fa !important;
}

.colegio-selected {
    @apply flex items-center justify-center p-4 border-2 rounded-lg;
    border-color: var(--p-primary-300);
    background-color: var(--p-primary-100);
}

.colegio-info {
    @apply flex items-center justify-center space-x-3 flex-1;
}

.colegio-icon {
    @apply w-5 h-5 flex-shrink-0;
    color: var(--p-primary-700);
}

.colegio-details {
    @apply flex-1 min-w-0 text-center;
}

.colegio-nombre {
    @apply font-medium truncate;
    color: var(--p-primary-900);
}

.colegio-location {
    @apply text-sm mt-1;
    color: var(--p-primary-700);
}

:global(html.dark) .colegio-selected {
    background-color: #1e3a5f !important;
    border-color: #3b82f6 !important;
}

:global(html.dark) .colegio-nombre {
    color: #e0f2fe !important;
}

:global(html.dark) .colegio-location,
:global(html.dark) .colegio-icon {
    color: #93c5fd !important;
}

:deep(.colegio-change-button) {
    @apply ml-4;
}

:deep(.colegio-completed .p-button) {
    background-color: var(--p-primary-500) !important;
    border-color: var(--p-primary-700) !important;
    color: white !important;
}

:deep(.colegio-completed .p-button:hover) {
    background-color: var(--p-primary-700) !important;
    border-color: var(--p-primary-900) !important;
}



/* Estilos para tooltips personalizados */
:deep(.custom-tooltip-panel) {
    @apply max-w-xs;
    padding: 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.custom-tooltip {
    @apply max-w-xs;
    padding: 0.75rem;
}

.custom-tooltip p {
    @apply text-sm text-gray-700;
    margin: 0;
}

/* Estilos para consentimiento de contacto */
.consentimiento-field {
    @apply col-span-1 md:col-span-2;
}

.consentimiento-wrapper {
    @apply flex items-start gap-3 rounded-xl border border-gray-200 p-4 relative;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(147, 197, 253, 0.06) 100%);
    border-left: 4px solid var(--p-primary-500);
}

.consentimiento-asterisco {
    @apply flex-shrink-0 mt-0.5 font-bold text-lg leading-none;
    color: var(--p-primary-600);
}

.consentimiento-icon {
    @apply flex-shrink-0 mt-0.5;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--p-primary-600);
}

.consentimiento-content {
    @apply flex-1 min-w-0;
}

.consentimiento-title {
    @apply text-sm leading-relaxed;
    color: var(--p-primary-900);
}

.consentimiento-disclaimer {
    @apply text-xs text-gray-500 italic mt-2.5;
}

:global(html.dark) .consentimiento-asterisco,
:global(html.dark) .consentimiento-icon {
    color: #93c5fd !important;
}

:global(html.dark) .consentimiento-wrapper {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 64, 175, 0.2) 100%) !important;
    border-color: rgba(147, 197, 253, 0.35) !important;
    border-left-color: #60a5fa !important;
}

:global(html.dark) .consentimiento-title {
    color: #e0f2fe !important;
}

:global(html.dark) .consentimiento-disclaimer {
    color: #94a3b8 !important;
}

/* Responsive */
@media (max-width: 768px) {
    .nivel-educativo-field {
        @apply col-span-1;
    }

    .colegio-field {
        @apply col-span-1;
    }

    .consentimiento-field {
        @apply col-span-1;
    }

    .nivel-educativo-checkboxes {
        @apply gap-2;
    }

    .colegio-selected {
        @apply flex-col items-center space-y-3;
    }

    .colegio-info {
        @apply justify-center;
    }

    .colegio-details {
        @apply text-center;
    }

    :deep(.colegio-change-button) {
        @apply ml-0 w-full;
    }
}
</style>
