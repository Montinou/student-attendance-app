# Arquitectura del Sistema

## 1. Visión General de la Arquitectura

El Sistema de Asistencia Estudiantil utiliza una arquitectura **serverless moderna** basada en **React Server Components** y **Backend-as-a-Service (BaaS)**. Esta arquitectura proporciona escalabilidad automática, alta disponibilidad y costos operativos mínimos.

### Principios Arquitectónicos

1. **Separation of Concerns:** Separación clara entre lógica de presentación, negocio y datos
2. **Progressive Enhancement:** Funcionalidad básica sin JavaScript, mejorada con interactividad
3. **Security by Default:** Seguridad implementada en múltiples capas
4. **API-First Design:** Backend diseñado como API REST consumible
5. **Mobile-First:** Diseño responsivo con prioridad en dispositivos móviles

---

## 2. Diagrama de Arquitectura de Alto Nivel

```mermaid
graph TB
    subgraph "Cliente - Navegador"
        A[React UI Components]
        B[QR Scanner]
        C[QR Generator Canvas]
        D[Form Components]
    end

    subgraph "Vercel Edge Network"
        E[Next.js Server]
        F[React Server Components]
        G[API Routes]
        H[Middleware Auth]
    end

    subgraph "Supabase Backend"
        I[PostgreSQL Database]
        J[Supabase Auth]
        K[Row Level Security]
        L[Realtime Engine]
    end

    A --> |HTTP/HTTPS| E
    B --> |Scan Result| G
    C --> |Request QR| G
    D --> |Form Submit| G

    E --> F
    F --> |Fetch Data| I
    G --> |CRUD Operations| I
    H --> |Verify Session| J

    J --> |JWT Token| H
    K --> |Enforce Policies| I
    L --> |Subscribe| F

    style A fill:#61dafb
    style E fill:#000000,color:#fff
    style I fill:#3ecf8e
```

---

## 3. Arquitectura de Capas Detallada

### Capa 1: Presentación (Frontend)

**Tecnología:** React 19 + Next.js 16 App Router

```mermaid
graph LR
    subgraph "Frontend Layer"
        A[Pages/Routes] --> B[Layouts]
        B --> C[Server Components]
        B --> D[Client Components]
        C --> E[Data Fetching]
        D --> F[User Interactions]
        F --> G[API Calls]
    end

    style C fill:#87CEEB
    style D fill:#FFB6C1
```

**Componentes:**
- **Páginas (Pages):** Rutas del App Router (`app/**/page.tsx`)
- **Layouts:** Estructuras compartidas con navegación
- **Server Components:** Renderizado en servidor, acceso directo a datos
- **Client Components:** Interactividad del cliente (`'use client'`)
- **Componentes UI:** shadcn/ui components reutilizables

**Responsabilidades:**
- Renderizar interfaz de usuario
- Manejar interacciones del usuario
- Validación de formularios (client-side)
- Escaneo y generación de códigos QR
- Navegación y routing

### Capa 2: Lógica de Negocio (Backend/API)

**Tecnología:** Next.js API Routes + Supabase Client

```mermaid
graph TB
    subgraph "Business Logic Layer"
        A[API Routes] --> B[Service Layer]
        B --> C[Validation Layer]
        B --> D[Authorization Layer]
        C --> E[Database Access]
        D --> E
        E --> F[Supabase Client]
    end

    style B fill:#90EE90
    style C fill:#FFD700
    style D fill:#FF6347
```

**Componentes:**
- **API Routes:** Endpoints REST (`app/api/**/route.ts`)
- **Services:** Lógica de negocio encapsulada (`lib/services/*.service.ts`)
- **Validations:** Zod schemas para validación de datos
- **Authorization:** Verificación de roles y permisos
- **Supabase Clients:** Cliente browser y servidor

**Responsabilidades:**
- Procesar solicitudes HTTP
- Validar datos de entrada
- Aplicar reglas de negocio
- Gestionar transacciones
- Manejar errores y excepciones

### Capa 3: Datos (Database)

**Tecnología:** PostgreSQL via Supabase

```mermaid
graph TB
    subgraph "Data Layer"
        A[PostgreSQL Database] --> B[Tables]
        A --> C[Views]
        A --> D[Functions]
        A --> E[Triggers]
        B --> F[Row Level Security]
        F --> G[Policies]
    end

    style A fill:#336791,color:#fff
    style F fill:#FF4500,color:#fff
```

**Componentes:**
- **Tablas:** Almacenamiento estructurado de datos
- **RLS Policies:** Control de acceso a nivel de fila
- **Triggers:** Automatización de lógica (ej. crear perfil)
- **Funciones:** Lógica compleja en PostgreSQL
- **Índices:** Optimización de consultas

**Responsabilidades:**
- Almacenar datos persistentes
- Garantizar integridad referencial
- Aplicar políticas de seguridad
- Optimizar consultas
- Ejecutar lógica en base de datos

---

## 4. Flujo de Datos en la Aplicación

### Flujo de Lectura (Data Fetching)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant SC as Server Component
    participant API as API/Database
    participant CC as Client Component

    U->>SC: Navega a página
    SC->>API: fetch() - Server Side
    API-->>SC: Datos
    SC->>CC: Renderiza con datos
    CC-->>U: HTML interactivo

    Note over SC,API: Sin JavaScript en cliente<br/>para fetch inicial
```

**Características:**
- Fetch en servidor usando `createClient()` de `lib/supabase/server.ts`
- Sin necesidad de estados de carga en cliente
- SEO-friendly (contenido pre-renderizado)
- Menor bundle de JavaScript enviado al cliente

### Flujo de Escritura (Mutations)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant CC as Client Component
    participant API as API Route
    participant DB as Database
    participant SC as Server Component

    U->>CC: Acción (click, submit)
    CC->>API: POST/PUT/DELETE
    API->>API: Validar datos
    API->>DB: Mutation
    DB-->>API: Resultado
    API-->>CC: Response
    CC->>SC: router.refresh()
    SC->>DB: Re-fetch data
    DB-->>SC: Datos actualizados
    SC-->>U: UI actualizado
```

**Características:**
- Mutations via API Routes
- Validación con Zod schemas
- Revalidación automática con `router.refresh()`
- Optimistic updates opcionales

---

## 5. Arquitectura de Autenticación

```mermaid
graph TB
    subgraph "Authentication Flow"
        A[Usuario ingresa credenciales] --> B[Supabase Auth]
        B --> C{Válidas?}
        C -->|Sí| D[Genera JWT]
        C -->|No| E[Error 401]
        D --> F[Almacena en Cookie httpOnly]
        F --> G[Middleware verifica token]
        G --> H{Token válido?}
        H -->|Sí| I[Permite acceso]
        H -->|No| J[Redirect /auth/login]
        I --> K[Verifica rol en DB]
        K --> L{Rol correcto?}
        L -->|Sí| M[Renderiza página]
        L -->|No| N[Redirect dashboard correcto]
    end

    style B fill:#3ecf8e
    style D fill:#FFD700
    style K fill:#FF6347
```

### Componentes de Autenticación

1. **Supabase Auth:**
   - Gestiona usuarios en tabla `auth.users`
   - Genera JWT tokens
   - Maneja verificación de email
   - Refresco automático de tokens

2. **Middleware de Next.js:**
   - Intercepta todas las solicitudes
   - Verifica y refresca sesiones
   - Redirige usuarios no autenticados
   - Ubicación: `middleware.ts`

3. **Layout Guards:**
   - Verifican rol del usuario desde DB
   - Previenen acceso no autorizado
   - Redirigen a dashboard correcto
   - Ubicación: `app/teacher/layout.tsx`, `app/student/layout.tsx`

4. **Row Level Security (RLS):**
   - Políticas a nivel de base de datos
   - Acceso basado en `auth.uid()`
   - Última línea de defensa

---

## 6. Arquitectura de Componentes

### Jerarquía de Componentes

```mermaid
graph TB
    subgraph "Component Hierarchy"
        A[RootLayout] --> B[Page Layout]
        B --> C[Server Component]
        B --> D[Client Component]
        C --> E[shadcn/ui Components]
        D --> E
        D --> F[Custom Components]
        F --> G[QRGenerator]
        F --> H[QRScanner]
        F --> I[DataTable]
    end

    style C fill:#87CEEB
    style D fill:#FFB6C1
```

### Tipos de Componentes

#### Server Components (Por Defecto)

```typescript
// app/teacher/page.tsx
export default async function TeacherDashboard() {
  const supabase = await createClient() // Server client
  const { data: subjects } = await supabase.from('subjects').select('*')

  return <SubjectsList subjects={subjects} />
}
```

**Ventajas:**
- Acceso directo a base de datos
- No incrementan bundle de JavaScript
- SEO-friendly
- Mejor rendimiento inicial

**Cuándo usar:**
- Fetching de datos
- Operaciones costosas
- Contenido estático o semi-estático

#### Client Components (`'use client'`)

```typescript
'use client'

// components/qr-scanner-dialog.tsx
export function QRScannerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Lógica de escaneo con hooks
}
```

**Ventajas:**
- Interactividad (onClick, onChange, etc.)
- Hooks de React (useState, useEffect)
- Acceso a APIs del navegador
- Animaciones y transiciones

**Cuándo usar:**
- Formularios interactivos
- Escaneo de QR (acceso a cámara)
- Estados locales
- Event listeners

---

## 7. Arquitectura de Código QR

### Sistema de Generación (Servidor)

```mermaid
graph LR
    A[Profesor solicita QR] --> B[API Route]
    B --> C[Generar código único]
    C --> D[Crear session en DB]
    D --> E[Generar imagen QR]
    E --> F[Retornar base64 data URL]
    F --> G[Renderizar en Canvas]

    style C fill:#FFD700
    style E fill:#90EE90
```

**Proceso:**
1. Formato del código: `{subjectId}-{timestamp}-{random}`
2. Inserción en tabla `attendance_sessions` con `expires_at`
3. Generación de imagen PNG 300x300px
4. Codificación en base64 data URL
5. Envío al cliente para renderizado

### Sistema de Escaneo (Cliente)

```mermaid
graph LR
    A[Estudiante abre scanner] --> B[Solicitar permiso cámara]
    B --> C[Inicializar BrowserMultiFormatReader]
    C --> D[Stream video a elemento HTML]
    D --> E[Detectar código QR]
    E --> F[Enviar código a API]
    F --> G[Validar en servidor]
    G --> H[Registrar asistencia]
    H --> I[Mostrar confirmación]

    style B fill:#FF6347
    style G fill:#FFD700
    style H fill:#90EE90
```

**Validaciones en Servidor:**
1. ✅ Sesión existe en base de datos
2. ✅ Sesión no expirada (`expires_at > now()`)
3. ✅ Estudiante inscrito en la materia
4. ✅ No hay asistencia duplicada para esta sesión

---

## 8. Patrones de Diseño Implementados

### 8.1 Repository Pattern (Implícito)

```typescript
// lib/services/subject.service.ts
export class SubjectService {
  async getSubjectsByTeacher(teacherId: string) {
    const supabase = createClient()
    return await supabase
      .from('subjects')
      .select('*')
      .eq('teacher_id', teacherId)
  }

  async createSubject(data: SubjectInsert) {
    // Lógica de creación
  }
}
```

**Beneficios:**
- Abstracción de acceso a datos
- Reutilización de lógica
- Facilita testing y mocking

### 8.2 Factory Pattern

```typescript
// lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(/* ... */)
}

// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(/* ... */)
}
```

**Beneficios:**
- Configuración centralizada
- Clientes específicos por entorno
- Manejo consistente de cookies

### 8.3 Strategy Pattern (RLS Policies)

Diferentes estrategias de acceso según el rol:

```sql
-- Profesores pueden ver/editar sus materias
CREATE POLICY "Teachers manage own subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Estudiantes pueden ver todas las materias
CREATE POLICY "Students view all subjects"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );
```

### 8.4 Observer Pattern (Realtime)

```typescript
useEffect(() => {
  const channel = supabase
    .channel('attendance_updates')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'attendance_records' },
      (payload) => {
        setRecords(prev => [...prev, payload.new])
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

**Beneficios:**
- Actualizaciones en tiempo real
- Desacoplamiento de componentes
- Sincronización automática

---

## 9. Seguridad en Capas (Defense in Depth)

```mermaid
graph TB
    A[Request del Usuario] --> B[Capa 1: HTTPS/TLS]
    B --> C[Capa 2: Middleware Auth]
    C --> D[Capa 3: Layout Role Guard]
    D --> E[Capa 4: API Validation]
    E --> F[Capa 5: Row Level Security]
    F --> G[Acceso a Datos]

    style B fill:#90EE90
    style C fill:#FFD700
    style D fill:#FF6347
    style E fill:#87CEEB
    style F fill:#FF69B4
```

### Capas de Seguridad

1. **Transporte:** HTTPS obligatorio (enforced por Vercel)
2. **Autenticación:** JWT en cookies httpOnly
3. **Autorización de Ruta:** Guards en layouts
4. **Validación de Input:** Zod schemas en API
5. **Acceso a Datos:** RLS policies en PostgreSQL

---

## 10. Escalabilidad y Rendimiento

### Estrategias de Escalabilidad

```mermaid
graph LR
    A[Usuario] --> B[Vercel Edge Network]
    B --> C[CDN Cache]
    B --> D[Serverless Functions]
    D --> E[Supabase Connection Pool]
    E --> F[PostgreSQL]

    style B fill:#000000,color:#fff
    style D fill:#90EE90
    style E fill:#3ecf8e
```

**Características:**

1. **Serverless Auto-scaling:**
   - Funciones se escalan automáticamente
   - Pago solo por uso (no servidores idle)
   - Sin límite de concurrencia

2. **Edge Network:**
   - Contenido estático servido desde CDN
   - Baja latencia global (<50ms)
   - Cache automático de assets

3. **Connection Pooling:**
   - Supabase maneja pool de conexiones
   - Soporte para miles de conexiones concurrentes
   - Reutilización eficiente de conexiones

4. **Database Optimization:**
   - Índices en foreign keys
   - Consultas optimizadas con `.select()` específico
   - RLS con índices para rendimiento

### Optimizaciones de Rendimiento

1. **Code Splitting:**
   - Automático por ruta en Next.js
   - Dynamic imports para componentes pesados
   - Lazy loading de librerías de QR

2. **Server Components:**
   - Reducción de JavaScript enviado al cliente
   - Renderizado en servidor (menor carga en navegador)
   - Streaming de contenido progresivo

3. **Caching:**
   - Cache de assets estáticos (CSS, JS, imágenes)
   - `cache: 'no-store'` para datos dinámicos
   - Revalidación con `router.refresh()`

4. **Database Queries:**
   - `.select('specific,columns')` en lugar de `select('*')`
   - `.limit()` para paginación
   - Índices en campos de búsqueda frecuente

---

## 11. Resiliencia y Manejo de Errores

### Estrategia de Manejo de Errores

```mermaid
graph TB
    A[Error Ocurre] --> B{Tipo de Error}
    B -->|Network| C[Retry con Exponential Backoff]
    B -->|Validation| D[Mostrar mensaje al usuario]
    B -->|Authorization| E[Redirect a login]
    B -->|Database| F[Log y mensaje genérico]

    C --> G[Máximo 3 intentos]
    G -->|Falla| H[Mostrar error final]

    style B fill:#FFD700
    style F fill:#FF6347
```

### Patrones de Resiliencia

1. **Graceful Degradation:**
   - Funcionalidad básica sin JavaScript
   - Fallbacks para características avanzadas
   - Mensajes claros de error

2. **Optimistic UI:**
   - Actualizar UI inmediatamente
   - Revertir si mutation falla
   - Mejorar percepción de velocidad

3. **Error Boundaries:**
   - Captura de errores en componentes React
   - Páginas de error personalizadas
   - Logging de errores para debugging

4. **Retry Logic:**
   - Reintentos automáticos para errores transitorios
   - Exponential backoff para evitar sobrecarga
   - Circuit breaker para fallos persistentes

---

## 12. Diagrama de Despliegue

```mermaid
graph TB
    subgraph "Developer"
        A[Git Push to Main]
    end

    subgraph "Vercel"
        B[Auto Build]
        C[TypeScript Check]
        D[Deploy to Edge]
        E[Production URL]
    end

    subgraph "Supabase"
        F[PostgreSQL Instance]
        G[Auth Service]
        H[Realtime Service]
    end

    subgraph "Users"
        I[Desktop Browser]
        J[Mobile Browser]
        K[Tablet]
    end

    A --> B
    B --> C
    C --> D
    D --> E

    E --> I
    E --> J
    E --> K

    I --> F
    J --> F
    K --> F

    I --> G
    J --> G
    K --> G

    style B fill:#000000,color:#fff
    style F fill:#3ecf8e
```

---

## Conclusión

La arquitectura del Sistema de Asistencia Estudiantil ha sido diseñada siguiendo principios modernos de desarrollo web:

- **Modularidad:** Separación clara de responsabilidades
- **Escalabilidad:** Arquitectura serverless que crece automáticamente
- **Seguridad:** Múltiples capas de protección
- **Rendimiento:** Optimizaciones a nivel de framework y base de datos
- **Mantenibilidad:** Código TypeScript tipado y estructurado

Esta arquitectura proporciona una base sólida para el crecimiento futuro del sistema, permitiendo agregar nuevas funcionalidades sin comprometer el rendimiento o la seguridad.

---

[← Resumen Ejecutivo](01-RESUMEN_EJECUTIVO.md) | [Volver al Índice](README.md) | [Siguiente: Stack Tecnológico →](03-TECNOLOGIAS_STACK.md)
