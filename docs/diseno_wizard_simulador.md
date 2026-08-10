# 🧙‍♂️ Diseño de Wizard - Simulador de Becas UNIACC

## 🎯 **Filosofía del Wizard**

### **Principios de Diseño (Inspirado en MIT, Harvard, Stanford)**
1. **Progreso Visual Claro**: El usuario siempre sabe dónde está y cuánto falta
2. **Una Tarea por Pantalla**: Enfoque total en cada paso
3. **Validación Inteligente**: Feedback inmediato y útil
4. **Navegación Flexible**: Permitir ir hacia atrás y guardar progreso
5. **Micro-interacciones**: Animaciones sutiles que guían la atención
6. **Accesibilidad Total**: Compatible con lectores de pantalla y navegación por teclado

---

## 🚀 **Estructura del Wizard (5 Pasos)**

### **Paso 0: Bienvenida e Introducción** 🎉
```vue
<template>
  <div class="wizard-step welcome-step">
    <div class="text-center space-y-6">
      <div class="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
        <GraduationCap class="w-12 h-12 text-blue-600" />
      </div>
      
      <div>
        <h1 class="text-4xl font-bold text-gray-900">
          Simulador de Becas UNIACC
        </h1>
        <p class="text-xl text-gray-600 mt-4">
          Descubre las becas y beneficios disponibles para tu educación
        </p>
      </div>
      
      <div class="bg-blue-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold text-blue-900 mb-3">
          ¿Qué puedes esperar?
        </h3>
        <ul class="text-left space-y-2 text-blue-800">
          <li class="flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-green-500" />
            Simulación personalizada en 5 minutos
          </li>
          <li class="flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-green-500" />
            Resultados instantáneos y precisos
          </li>
          <li class="flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-green-500" />
            Información sobre más de 150 beneficios
          </li>
        </ul>
      </div>
      
      <Button size="lg" @click="iniciarSimulacion" class="px-8 py-3">
        Comenzar Simulación
        <ArrowRight class="w-5 h-5 ml-2" />
      </Button>
    </div>
  </div>
</template>
```

### **Paso 1: Datos Personales** 👤
```vue
<template>
  <div class="wizard-step">
    <WizardHeader 
      title="Datos Personales"
      description="Necesitamos conocer algunos datos básicos para personalizar tu simulación"
      step="1"
      total="5"
    />
    
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Nombre y Apellido -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label for="nombre">Nombre *</Label>
          <Input 
            id="nombre" 
            v-model="form.nombre"
            placeholder="Tu nombre"
            :class="{ 'border-red-500': errors.nombre }"
          />
          <p v-if="errors.nombre" class="text-red-500 text-sm mt-1">
            {{ errors.nombre }}
          </p>
        </div>
        <div>
          <Label for="apellido">Apellido *</Label>
          <Input 
            id="apellido" 
            v-model="form.apellido"
            placeholder="Tu apellido"
            :class="{ 'border-red-500': errors.apellido }"
          />
        </div>
      </div>
      
      <!-- Email y Teléfono -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label for="email">Email *</Label>
          <Input 
            id="email" 
            type="email"
            v-model="form.email"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <Label for="telefono">Teléfono</Label>
          <Input 
            id="telefono" 
            v-model="form.telefono"
            placeholder="+56 9 1234 5678"
          />
        </div>
      </div>
      
      <!-- Identificación -->
      <div>
        <Label>Tipo de Identificación *</Label>
        <RadioGroup v-model="form.tipoIdentificacion" class="mt-2">
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="rut" id="rut" />
            <Label for="rut">RUT Chileno</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="pasaporte" id="pasaporte" />
            <Label for="pasaporte">Pasaporte</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div v-if="form.tipoIdentificacion">
        <Label for="identificacion">
          {{ form.tipoIdentificacion === 'rut' ? 'RUT' : 'Número de Pasaporte' }} *
        </Label>
        <Input 
          id="identificacion" 
          v-model="form.identificacion"
          :placeholder="form.tipoIdentificacion === 'rut' ? '12.345.678-9' : 'A1234567'"
        />
      </div>
      
      <!-- Nacionalidad -->
      <div>
        <Label for="nacionalidad">Nacionalidad *</Label>
        <Select v-model="form.nacionalidad">
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu nacionalidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="nacionalidad in nacionalidades" 
              :key="nacionalidad.id"
              :value="nacionalidad.id"
            >
              {{ nacionalidad.nombre_espanol }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Fecha de Nacimiento -->
      <div>
        <Label for="fechaNacimiento">Fecha de Nacimiento *</Label>
        <DatePicker v-model="form.fechaNacimiento" />
      </div>
    </div>
    
    <WizardNavigation 
      :can-go-back="false"
      :can-go-next="isStepValid"
      @next="siguientePaso"
    />
  </div>
</template>
```

### **Paso 2: Datos Académicos** 🎓
```vue
<template>
  <div class="wizard-step">
    <WizardHeader 
      title="Datos Académicos"
      description="Cuéntanos sobre tu formación educacional"
      step="2"
      total="5"
    />
    
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Nivel Educativo -->
      <div>
        <Label for="nivelEducativo">¿En qué nivel educativo te encuentras? *</Label>
        <Select v-model="form.nivelEducativo">
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu nivel educativo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1ro Medio">1ro Medio</SelectItem>
            <SelectItem value="2do Medio">2do Medio</SelectItem>
            <SelectItem value="3ro Medio">3ro Medio</SelectItem>
            <SelectItem value="4to Medio">4to Medio</SelectItem>
            <SelectItem value="Egresado">Egresado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Colegio -->
      <div>
        <Label for="colegio">Colegio o Establecimiento Educacional *</Label>
        <Combobox
          v-model="form.colegio"
          :options="colegios"
          placeholder="Busca tu colegio..."
          @search="buscarColegios"
        />
        <p class="text-sm text-gray-500 mt-1">
          Si no encuentras tu colegio, puedes escribirlo manualmente
        </p>
      </div>
      
      <!-- Carrera Deseada -->
      <div>
        <Label for="carrera">Carrera de Interés *</Label>
        <Select v-model="form.carrera">
          <SelectTrigger>
            <SelectValue placeholder="Selecciona la carrera que te interesa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ingeniería">Ingeniería</SelectItem>
            <SelectItem value="Diseño">Diseño</SelectItem>
            <SelectItem value="Comunicación">Comunicación</SelectItem>
            <SelectItem value="Psicología">Psicología</SelectItem>
            <!-- Más carreras... -->
          </SelectContent>
        </Select>
      </div>
      
      <!-- Campos Condicionales para Egresados -->
      <div v-if="form.nivelEducativo === 'Egresado'" class="space-y-4 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-900">Datos de Egreso</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="nem">NEM (Notas de Enseñanza Media) *</Label>
            <Input 
              id="nem" 
              v-model="form.nem"
              type="number"
              step="0.1"
              min="1.0"
              max="7.0"
              placeholder="6.5"
            />
            <p class="text-sm text-gray-500">Escala de 1.0 a 7.0</p>
          </div>
          
          <div>
            <Label for="ranking">Ranking de Notas *</Label>
            <Input 
              id="ranking" 
              v-model="form.ranking"
              type="number"
              step="0.1"
              min="0"
              max="1000"
              placeholder="850.5"
            />
            <p class="text-sm text-gray-500">Escala de 0 a 1000</p>
          </div>
        </div>
        
        <div>
          <Label for="añoEgreso">Año de Egreso *</Label>
          <Select v-model="form.añoEgreso">
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="año in añosEgreso" 
                :key="año"
                :value="año"
              >
                {{ año }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
    
    <WizardNavigation 
      :can-go-back="true"
      :can-go-next="isStepValid"
      @back="anteriorPaso"
      @next="siguientePaso"
    />
  </div>
</template>
```

### **Paso 3: Situación Socioeconómica** 💰
```vue
<template>
  <div class="wizard-step">
    <WizardHeader 
      title="Situación Socioeconómica"
      description="Esta información nos ayuda a determinar tu elegibilidad para diferentes becas"
      step="3"
      total="5"
    />
    
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Ingreso Familiar -->
      <div>
        <Label for="ingresoMensual">Ingreso Mensual Familiar *</Label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
          <Input 
            id="ingresoMensual" 
            v-model="form.ingresoMensual"
            type="number"
            class="pl-8"
            placeholder="500000"
          />
        </div>
        <p class="text-sm text-gray-500 mt-1">
          Ingreso total mensual de tu hogar (padres, tutores, etc.)
        </p>
      </div>
      
      <!-- Número de Integrantes -->
      <div>
        <Label for="integrantes">Número de Integrantes en el Hogar *</Label>
        <Select v-model="form.integrantes">
          <SelectTrigger>
            <SelectValue placeholder="¿Cuántas personas viven en tu hogar?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 persona</SelectItem>
            <SelectItem value="2">2 personas</SelectItem>
            <SelectItem value="3">3 personas</SelectItem>
            <SelectItem value="4">4 personas</SelectItem>
            <SelectItem value="5">5 personas</SelectItem>
            <SelectItem value="6+">6 o más personas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <!-- Decil Calculado Automáticamente -->
      <div v-if="decilCalculado" class="p-4 bg-green-50 rounded-lg">
        <div class="flex items-center">
          <Info class="w-5 h-5 text-green-600 mr-2" />
          <span class="text-green-800 font-medium">
            Decil Calculado: {{ decilCalculado }}
          </span>
        </div>
        <p class="text-sm text-green-700 mt-1">
          Basado en tu ingreso familiar y número de integrantes
        </p>
      </div>
      
      <!-- CAE -->
      <div>
        <div class="flex items-center space-x-2">
          <Switch 
            id="cae" 
            v-model="form.tieneCAE"
          />
          <Label for="cae">¿Tienes CAE (Crédito con Aval del Estado)?</Label>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          Esto puede afectar tu elegibilidad para ciertas becas
        </p>
      </div>
    </div>
    
    <WizardNavigation 
      :can-go-back="true"
      :can-go-next="isStepValid"
      @back="anteriorPaso"
      @next="siguientePaso"
    />
  </div>
</template>
```

### **Paso 4: PAES (Opcional)** 📝
```vue
<template>
  <div class="wizard-step">
    <WizardHeader 
      title="Datos PAES (Opcional)"
      description="Si rendiste la PAES, puedes incluir tus puntajes para una simulación más precisa"
      step="4"
      total="5"
    />
    
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- ¿Rindió PAES? -->
      <div>
        <div class="flex items-center space-x-2">
          <Switch 
            id="rendioPAES" 
            v-model="form.rendioPAES"
          />
          <Label for="rendioPAES">¿Rendiste la PAES?</Label>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          La PAES no es obligatoria para ingresar a UNIACC, pero puede mejorar tu elegibilidad
        </p>
      </div>
      
      <!-- Campos de PAES (Condicionales) -->
      <div v-if="form.rendioPAES" class="space-y-4 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-900">Puntajes PAES</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="matematica">Matemática</Label>
            <Input 
              id="matematica" 
              v-model="form.paes.matematica"
              type="number"
              min="100"
              max="1000"
              placeholder="750"
            />
          </div>
          
          <div>
            <Label for="lenguaje">Lenguaje</Label>
            <Input 
              id="lenguaje" 
              v-model="form.paes.lenguaje"
              type="number"
              min="100"
              max="1000"
              placeholder="800"
            />
          </div>
          
          <div>
            <Label for="ciencias">Ciencias</Label>
            <Input 
              id="ciencias" 
              v-model="form.paes.ciencias"
              type="number"
              min="100"
              max="1000"
              placeholder="700"
            />
          </div>
          
          <div>
            <Label for="historia">Historia</Label>
            <Input 
              id="historia" 
              v-model="form.paes.historia"
              type="number"
              min="100"
              max="1000"
              placeholder="750"
            />
          </div>
        </div>
      </div>
      
      <!-- Información sobre PAES -->
      <div class="bg-yellow-50 p-4 rounded-lg">
        <div class="flex items-start">
          <Info class="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
          <div>
            <h4 class="font-semibold text-yellow-800">¿Sabías que?</h4>
            <p class="text-sm text-yellow-700 mt-1">
              UNIACC no exige PAES para el ingreso. Puedes omitir este paso si no rendiste la prueba.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <WizardNavigation 
      :can-go-back="true"
      :can-go-next="true"
      @back="anteriorPaso"
      @next="siguientePaso"
    />
  </div>
</template>
```

### **Paso 5: Resultados** 🎯
```vue
<template>
  <div class="wizard-step">
    <WizardHeader 
      title="Resultados de tu Simulación"
      description="Aquí están las becas y beneficios disponibles para ti"
      step="5"
      total="5"
      :show-progress="false"
    />
    
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Resumen Financiero -->
      <ResumenFinanciero :resultados="resultados" />
      
      <!-- Beneficios Aplicables -->
      <div>
        <h3 class="text-2xl font-bold mb-4">Beneficios Aplicables</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BeneficioCard 
            v-for="beneficio in beneficiosAplicables" 
            :key="beneficio.id"
            :beneficio="beneficio"
            :aplicable="true"
          />
        </div>
      </div>
      
      <!-- Otros Beneficios Disponibles -->
      <div v-if="beneficiosNoAplicables.length > 0">
        <h3 class="text-2xl font-bold mb-4">Otros Beneficios Disponibles</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BeneficioCard 
            v-for="beneficio in beneficiosNoAplicables" 
            :key="beneficio.id"
            :beneficio="beneficio"
            :aplicable="false"
          />
        </div>
      </div>
      
      <!-- Acciones -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" @click="nuevaSimulacion">
          <RefreshCw class="w-4 h-4 mr-2" />
          Nueva Simulación
        </Button>
        <Button @click="compartirResultados">
          <Share2 class="w-4 h-4 mr-2" />
          Compartir Resultados
        </Button>
        <Button variant="outline" @click="exportarPDF">
          <Download class="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>
    </div>
  </div>
</template>
```

---

## 🎨 **Componentes de Soporte del Wizard**

### **WizardHeader.vue**
```vue
<template>
  <div class="wizard-header text-center mb-8">
    <div class="flex items-center justify-center mb-4">
      <div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
        {{ step }}
      </div>
    </div>
    <h2 class="text-3xl font-bold text-gray-900 mb-2">{{ title }}</h2>
    <p class="text-lg text-gray-600">{{ description }}</p>
    
    <div v-if="showProgress" class="mt-6">
      <div class="flex justify-center space-x-2">
        <div 
          v-for="i in total" 
          :key="i"
          :class="[
            'w-3 h-3 rounded-full',
            i <= step ? 'bg-blue-600' : 'bg-gray-300'
          ]"
        />
      </div>
      <p class="text-sm text-gray-500 mt-2">
        Paso {{ step }} de {{ total }}
      </p>
    </div>
  </div>
</template>
```

### **WizardNavigation.vue**
```vue
<template>
  <div class="wizard-navigation flex justify-between items-center mt-8 pt-6 border-t">
    <Button 
      v-if="canGoBack"
      variant="outline" 
      @click="$emit('back')"
    >
      <ArrowLeft class="w-4 h-4 mr-2" />
      Anterior
    </Button>
    
    <div v-else></div>
    
    <Button 
      v-if="canGoNext"
      @click="$emit('next')"
    >
      {{ isLastStep ? 'Ver Resultados' : 'Siguiente' }}
      <ArrowRight v-if="!isLastStep" class="w-4 h-4 ml-2" />
      <Check v-else class="w-4 h-4 ml-2" />
    </Button>
    
    <div v-else class="text-sm text-gray-500">
      Completa todos los campos requeridos
    </div>
  </div>
</template>
```

---

## 🎯 **Características Clave del Wizard**

### **1. Progreso Visual**
- Barra de progreso clara
- Números de paso visibles
- Indicadores de completado

### **2. Validación Inteligente**
- Validación en tiempo real
- Mensajes de error específicos
- Campos requeridos claramente marcados

### **3. Navegación Flexible**
- Botón "Anterior" siempre disponible
- Guardado automático del progreso
- Posibilidad de saltar pasos opcionales

### **4. Micro-interacciones**
- Animaciones sutiles entre pasos
- Feedback visual inmediato
- Transiciones suaves

### **5. Responsive Design**
- Optimizado para móviles
- Adaptable a todas las pantallas
- Navegación táctil amigable

---

## 🚀 **Implementación Recomendada**

### **Orden de Desarrollo:**
1. **WizardHeader** y **WizardNavigation** (base)
2. **Paso 0**: Bienvenida (más simple)
3. **Paso 1**: Datos Personales (formulario básico)
4. **Paso 2**: Datos Académicos (con lógica condicional)
5. **Paso 3**: Socioeconómico (con cálculos)
6. **Paso 4**: PAES (opcional)
7. **Paso 5**: Resultados (más complejo)

### **Tecnologías Necesarias:**
- **Shadcn/ui**: Para componentes base
- **VueUse**: Para validaciones y estado
- **Pinia**: Para manejo de estado global
- **Framer Motion**: Para animaciones (opcional)

---

**¡Este wizard será intuitivo, educativo y profesional como los de las mejores universidades del mundo!** 🎓✨
