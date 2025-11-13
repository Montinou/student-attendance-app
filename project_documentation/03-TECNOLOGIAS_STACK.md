# Stack Tecnológico

## 1. Visión General del Stack

El Sistema de Asistencia Estudiantil utiliza un stack tecnológico moderno y probado en producción, que combina las últimas versiones de frameworks populares con servicios en la nube de alta calidad.

### Diagrama del Stack

```mermaid
graph TB
    subgraph "Frontend Stack"
        A[React 19.2.0]
        B[Next.js 16.0.0]
        C[TypeScript 5.x]
        D[Tailwind CSS 4.1.9]
        E[shadcn/ui]
    end

    subgraph "Backend Stack"
        F[Supabase]
        G[PostgreSQL]
        H[Supabase Auth]
        I[Supabase Realtime]
    end

    subgraph "DevOps Stack"
        J[Vercel]
        K[GitHub]
        L[Vercel Analytics]
    end

    subgraph "Specialized Libraries"
        M[qrcode]
        N[@zxing/browser]
        O[react-hook-form]
        P[zod]
        Q[recharts]
    end

    A --> B
    B --> C
    C --> D
    D --> E

    B --> F
    F --> G
    F --> H
    F --> I

    K --> J
    J --> L

    B --> M
    B --> N
    B --> O
    O --> P
    B --> Q

    style B fill:#000000,color:#fff
    style F fill:#3ecf8e
    style J fill:#000000,color:#fff
```

---

## 2. Framework Principal: Next.js 16

### Información Básica

- **Versión:** 16.0.0 (Última versión estable)
- **Lanzamiento:** Diciembre 2024
- **Fabricante:** Vercel
- **Licencia:** MIT
- **Website:** https://nextjs.org

### Características Clave Utilizadas

#### App Router (Arquitectura Moderna)

```typescript
// Estructura del App Router
app/
  layout.tsx      // Layout raíz
  page.tsx        // Página principal
  teacher/
    layout.tsx    // Layout de profesor (con guard)
    page.tsx      // Dashboard profesor
  student/
    layout.tsx    // Layout de estudiante (con guard)
    page.tsx      // Dashboard estudiante
```

**Beneficios:**
- Server Components por defecto
- Layouts anidados y reutilizables
- Loading y error states automáticos
- Streaming y Suspense integrados

#### React Server Components (RSC)

```typescript
// Server Component - Sin 'use client'
export default async function TeacherDashboard() {
  // Fetch directo en servidor
  const supabase = await createClient()
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')

  return <SubjectsList subjects={subjects} />
}
```

**Ventajas:**
- Zero JavaScript para componentes de servidor
- Acceso directo a base de datos
- SEO mejorado
- Menor tiempo de carga inicial

#### API Routes con App Router

```typescript
// app/api/subjects/route.ts
export async function GET(request: Request) {
  const supabase = createClient()
  const { data, error } = await supabase.from('subjects').select('*')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
```

**Características:**
- Endpoints REST integrados
- Soporte para Web APIs estándar (Request, Response)
- Middleware personalizable
- Hot reloading en desarrollo

### Optimizaciones Automáticas

1. **Code Splitting:** Código dividido automáticamente por ruta
2. **Image Optimization:** Componente `<Image>` con optimización automática
3. **Font Optimization:** Carga optimizada de fuentes con `next/font`
4. **Bundle Analysis:** Análisis de tamaño de bundle
5. **Minificación:** JavaScript y CSS minificados automáticamente

### ¿Por Qué Next.js 16?

✅ **Ventajas:**
- Arquitectura moderna con RSC
- Excelente rendimiento out-of-the-box
- Gran comunidad y ecosistema
- Integración perfecta con Vercel
- TypeScript first-class support
- Actualizaciones frecuentes

❌ **Desventajas:**
- Curva de aprendizaje para RSC
- Cambios significativos entre versiones
- Vendor lock-in ligero con Vercel

**Alternativas Consideradas:**
- **Remix:** Similar pero menos maduro
- **Vite + React Router:** Más control pero más configuración
- **Create React App (CRA):** Obsoleto, no recomendado

---

## 3. Biblioteca UI: React 19

### Información Básica

- **Versión:** 19.2.0
- **Lanzamiento:** Abril 2024
- **Fabricante:** Meta (Facebook)
- **Licencia:** MIT
- **Website:** https://react.dev

### Nuevas Características Utilizadas

#### React Compiler (Experimental)

React 19 incluye un compilador que optimiza automáticamente el código:

```typescript
// Antes: Necesitabas useMemo manualmente
const filteredData = useMemo(() => {
  return data.filter(item => item.active)
}, [data])

// Ahora: El compilador optimiza automáticamente
const filteredData = data.filter(item => item.active)
```

#### Acciones (Actions)

Manejo simplificado de formularios con estado de carga incorporado:

```typescript
'use client'

export function EnrollForm() {
  async function enrollAction(formData: FormData) {
    'use server'
    const subjectId = formData.get('subjectId')
    // Lógica de inscripción
  }

  return (
    <form action={enrollAction}>
      <button type="submit">Inscribirse</button>
    </form>
  )
}
```

#### use() Hook

Lectura de promesas en componentes:

```typescript
function SubjectDetails({ subjectPromise }) {
  const subject = use(subjectPromise)
  return <div>{subject.name}</div>
}
```

### Hooks Utilizados en el Proyecto

| Hook | Uso en el Proyecto | Ejemplo |
|------|-------------------|---------|
| `useState` | Estados locales (modal open, form data) | `const [isOpen, setIsOpen] = useState(false)` |
| `useEffect` | Suscripciones Realtime, cleanup de cámara | `useEffect(() => { /* setup */ return cleanup }, [])` |
| `useRef` | Referencias a video element para QR scanner | `const videoRef = useRef<HTMLVideoElement>(null)` |
| `useCallback` | Memoización de funciones en callbacks | `const handleScan = useCallback(() => {}, [])` |
| `useContext` | Theme context (claro/oscuro) | `const { theme } = useContext(ThemeContext)` |
| `useRouter` | Navegación programática | `const router = useRouter()` |

### ¿Por Qué React 19?

✅ **Ventajas:**
- Compilador automático (menos `useMemo`/`useCallback`)
- Server Components nativos
- Mejor rendimiento general
- Acciones simplificadas
- Backward compatible

❌ **Desventajas:**
- Algunas características experimentales
- Breaking changes mínimos desde v18

---

## 4. Lenguaje: TypeScript 5

### Información Básica

- **Versión:** 5.x
- **Fabricante:** Microsoft
- **Licencia:** Apache 2.0
- **Website:** https://www.typescriptlang.org

### Configuración del Proyecto

```json
// tsconfig.json (extracto)
{
  "compilerOptions": {
    "target": "ES6",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Tipos Personalizados del Proyecto

```typescript
// lib/types.ts

// User Profile
export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'teacher' | 'student'
  created_at: string
}

// Subject (Materia)
export interface Subject {
  id: string
  name: string
  code: string
  schedule: string | null
  description: string | null
  teacher_id: string
  created_at: string
}

// Attendance Session
export interface AttendanceSession {
  id: string
  subject_id: string
  qr_code: string
  expires_at: string
  created_at: string
}

// Attendance Record
export interface AttendanceRecord {
  id: string
  session_id: string
  student_id: string
  subject_id: string
  scanned_at: string
}

// Types para INSERT (sin campos generados)
export type SubjectInsert = Omit<Subject, 'id' | 'created_at'>
export type AttendanceRecordInsert = Omit<AttendanceRecord, 'id' | 'scanned_at'>
```

### Beneficios de TypeScript en el Proyecto

1. **Prevención de Errores:**
   ```typescript
   // Error en tiempo de compilación, no runtime
   const profile: Profile = {
     id: '123',
     email: 'test@example.com',
     role: 'admin' // ❌ Error: 'admin' no es 'teacher' | 'student'
   }
   ```

2. **Autocompletado en IDEs:**
   - IntelliSense completo
   - Documentación inline
   - Refactoring seguro

3. **Contratos de API:**
   ```typescript
   export async function createSubject(
     data: SubjectInsert
   ): Promise<Subject | null> {
     // TypeScript garantiza que data tiene los campos correctos
   }
   ```

4. **Validación de Props:**
   ```typescript
   interface SubjectCardProps {
     subject: Subject
     onEdit: (id: string) => void
   }

   export function SubjectCard({ subject, onEdit }: SubjectCardProps) {
     // Props tipadas, no más errores de props incorrectas
   }
   ```

---

## 5. Backend: Supabase

### Información Básica

- **Versión:** Latest (Cloud-managed)
- **Fabricante:** Supabase Inc.
- **Licencia:** Apache 2.0 (open source)
- **Website:** https://supabase.com

### Componentes Utilizados

#### PostgreSQL Database

**Versión:** PostgreSQL 15

```sql
-- Ejemplo de tabla con tipos PostgreSQL
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Características:**
- Base de datos relacional completa
- Constraints y foreign keys
- Triggers y functions
- Full-text search
- JSON/JSONB support

#### Supabase Auth

Sistema de autenticación completo:

```typescript
// Signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'student'
    }
  }
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})

// Logout
await supabase.auth.signOut()
```

**Características:**
- Email/password authentication
- OAuth providers (Google, GitHub, etc.) - no usado
- Email verification
- Password reset
- JWT tokens con refresh automático
- Session management con cookies

#### Row Level Security (RLS)

Políticas de seguridad a nivel de fila:

```sql
-- Solo profesores pueden crear materias
CREATE POLICY "Teachers create subjects"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Estudiantes ven todas las materias
CREATE POLICY "Students view subjects"
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

#### Supabase Realtime

Actualizaciones en vivo:

```typescript
const channel = supabase
  .channel('attendance_changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'attendance_records',
      filter: `subject_id=eq.${subjectId}`
    },
    (payload) => {
      console.log('Nueva asistencia:', payload.new)
      // Actualizar UI
    }
  )
  .subscribe()
```

### Clientes de Supabase en el Proyecto

#### Cliente Browser (Client Components)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Uso:**
```typescript
'use client'

export function ClientComponent() {
  const supabase = createClient()
  // Queries en cliente
}
```

#### Cliente Server (Server Components)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Uso:**
```typescript
// Server Component
export default async function ServerComponent() {
  const supabase = await createClient()
  // Queries en servidor
}
```

### ¿Por Qué Supabase?

✅ **Ventajas:**
- PostgreSQL completo (no limitado como Firebase)
- Row Level Security (seguridad a nivel de DB)
- Open source (sin vendor lock-in total)
- Realtime incluido
- Auth completo y robusto
- Plan gratuito generoso
- Excelente DX (Developer Experience)
- SQL directo disponible

❌ **Desventajas:**
- Menos maduro que AWS/Firebase
- Ecosystem más pequeño
- Algunas características en beta

**Alternativas Consideradas:**
- **Firebase:** NoSQL, menos flexible
- **AWS RDS + Amplify:** Más complejo de configurar
- **MongoDB Atlas:** NoSQL, menos apropiado para relaciones
- **PlanetScale:** Bueno pero sin Auth integrado

---

## 6. Estilos: Tailwind CSS v4

### Información Básica

- **Versión:** 4.1.9 (Latest)
- **Fabricante:** Tailwind Labs
- **Licencia:** MIT
- **Website:** https://tailwindcss.com

### Configuración del Proyecto

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Variables CSS personalizadas
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### Variables CSS Personalizadas

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* Más variables... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* Tema oscuro */
  }
}
```

### Ejemplos de Uso en el Proyecto

```typescript
// Componente con clases Tailwind
export function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold text-card-foreground mb-2">
        {subject.name}
      </h3>
      <p className="text-sm text-muted-foreground">
        Código: {subject.code}
      </p>
      <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
        Ver detalles
      </button>
    </div>
  )
}
```

### Plugin: tailwindcss-animate

```typescript
// Animaciones predefinidas
<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
  Contenido animado
</div>
```

### ¿Por Qué Tailwind CSS v4?

✅ **Ventajas:**
- Utility-first (desarrollo rápido)
- Purge automático (CSS mínimo en producción)
- Responsive design fácil
- Dark mode integrado
- Customización completa
- Performance excelente
- IntelliSense en VSCode

❌ **Desventajas:**
- HTML puede verse "sucio"
- Curva de aprendizaje inicial
- Clases muy largas en componentes complejos

---

## 7. Componentes UI: shadcn/ui

### Información Básica

- **Versión:** Latest (componentes individuales)
- **Fabricante:** shadcn (Comunidad)
- **Licencia:** MIT
- **Website:** https://ui.shadcn.com

### Componentes Utilizados en el Proyecto

| Componente | Uso | Ubicación |
|------------|-----|-----------|
| `Button` | Botones con variantes | `components/ui/button.tsx` |
| `Card` | Tarjetas de contenido | `components/ui/card.tsx` |
| `Dialog` | Modales (QR scanner, forms) | `components/ui/dialog.tsx` |
| `Form` | Formularios con validación | `components/ui/form.tsx` |
| `Input` | Campos de texto | `components/ui/input.tsx` |
| `Label` | Etiquetas de formulario | `components/ui/label.tsx` |
| `Select` | Dropdowns | `components/ui/select.tsx` |
| `Sheet` | Paneles laterales | `components/ui/sheet.tsx` |
| `Table` | Tablas de datos | `components/ui/table.tsx` |
| `Tabs` | Navegación por pestañas | `components/ui/tabs.tsx` |
| `Toast` | Notificaciones | `components/ui/toast.tsx` |
| `Separator` | Separadores visuales | `components/ui/separator.tsx` |

### Instalación de Componentes

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
# etc.
```

### Ejemplo: Button Component

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Uso
<Button variant="destructive" size="lg">
  Eliminar
</Button>
```

### ¿Por Qué shadcn/ui?

✅ **Ventajas:**
- Copy-paste (código en tu proyecto, no npm)
- Completamente customizable
- Basado en Radix UI (accesible)
- TypeScript nativo
- Tailwind CSS integrado
- Sin dependencias externas pesadas

❌ **Desventajas:**
- Más código en el repositorio
- Actualizaciones manuales por componente

**Alternativas Consideradas:**
- **Material-UI:** Más pesado, opinionado
- **Chakra UI:** Bueno pero con estilos propios
- **Ant Design:** Muy pesado, estilo específico

---

## 8. Librerías Especializadas

### 8.1 Códigos QR

#### Generación: qrcode

```typescript
import QRCode from 'qrcode'

// Generar imagen base64
const dataUrl = await QRCode.toDataURL(code, {
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
})
```

**Características:**
- PNG, SVG, Canvas support
- Customizable (colores, tamaño, margin)
- Ligero (~50KB)
- Sin dependencias

#### Escaneo: @zxing/browser

```typescript
import { BrowserMultiFormatReader } from '@zxing/browser'

const codeReader = new BrowserMultiFormatReader()

// Iniciar escaneo
const controls = await codeReader.decodeFromVideoDevice(
  deviceId,
  videoElement,
  (result, error) => {
    if (result) {
      console.log('QR detectado:', result.getText())
    }
  }
)

// Cleanup
controls.stop()
```

**Características:**
- Múltiples formatos (QR, Barcode, etc.)
- Camera access API
- TypeScript support
- Alta precisión de detección

### 8.2 Formularios: react-hook-form + zod

#### react-hook-form

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(subjectSchema),
  defaultValues: {
    name: '',
    code: '',
  }
})
```

**Ventajas:**
- Performance (menos re-renders)
- Validación integrada
- TypeScript support
- Pequeño bundle size

#### zod (Validación)

```typescript
import { z } from 'zod'

const subjectSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  code: z.string().regex(/^[A-Z0-9]+$/, 'Solo mayúsculas y números'),
  schedule: z.string().optional(),
})

type SubjectFormData = z.infer<typeof subjectSchema>
```

**Ventajas:**
- TypeScript-first
- Validaciones complejas
- Error messages personalizados
- Type inference automático

### 8.3 Gráficos: recharts

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const data = [
  { name: 'Lun', asistencia: 45 },
  { name: 'Mar', asistencia: 52 },
  // ...
]

<BarChart width={500} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="asistencia" fill="#8884d8" />
</BarChart>
```

**Ventajas:**
- Composable (componentes React)
- Responsive
- Animaciones incluidas
- Customizable

### 8.4 Fechas: date-fns

```typescript
import { format, isAfter, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'

// Formatear fecha
const formatted = format(new Date(), "d 'de' MMMM, yyyy", { locale: es })
// "13 de noviembre, 2024"

// Validar expiración
const isExpired = isAfter(new Date(), expiresAt)

// Calcular expiración
const expiresAt = addMinutes(new Date(), 30)
```

**Ventajas:**
- Modular (tree-shakeable)
- Inmutable
- TypeScript support
- I18n incluido

---

## 9. Herramientas de Desarrollo

### ESLint

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### PostCSS

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### TypeScript Compiler

```bash
# Verificar tipos sin compilar
npx tsc --noEmit
```

---

## 10. Infraestructura de Despliegue

### Vercel

**Características Utilizadas:**
- Serverless Functions (API Routes)
- Edge Network (CDN global)
- Automatic HTTPS
- Preview deployments (por branch)
- Analytics y Web Vitals

**Plan:** Hobby (Gratuito)

**Configuración:**

```javascript
// next.config.js
module.exports = {
  typescript: {
    ignoreBuildErrors: true, // Temporal
  },
  images: {
    unoptimized: true, // Para plan gratuito
  },
}
```

### Supabase

**Plan:** Free Tier

**Límites:**
- 500 MB de base de datos
- 1 GB de almacenamiento
- 50,000 usuarios activos mensuales
- 2 GB de transferencia

**Más que suficiente para uso universitario**

---

## 11. Testing

### Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

**Tests Implementados:**
- Login flow
- QR generation
- QR scanning
- Enrollment process

---

## 12. Resumen de Versiones

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.0.0 | Framework principal |
| React | 19.2.0 | Biblioteca UI |
| TypeScript | 5.x | Lenguaje |
| Tailwind CSS | 4.1.9 | Estilos |
| Supabase | Latest | Backend/Database |
| qrcode | Latest | Generación QR |
| @zxing/browser | Latest | Escaneo QR |
| react-hook-form | 7.60.0 | Formularios |
| zod | 3.25.76 | Validación |
| recharts | 2.15.4 | Gráficos |
| Playwright | 1.56.1 | Testing E2E |

---

## Conclusión

El stack tecnológico seleccionado para el Sistema de Asistencia Estudiantil representa el estado del arte en desarrollo web moderno. Cada tecnología fue elegida cuidadosamente considerando:

- **Rendimiento:** Optimizaciones automáticas y arquitectura eficiente
- **Seguridad:** Múltiples capas de protección
- **Escalabilidad:** Serverless y cloud-native
- **Mantenibilidad:** TypeScript y código estructurado
- **Developer Experience:** Herramientas modernas y productivas
- **Costo:** Plan gratuito o muy económico

Este stack permite desarrollar una aplicación de nivel profesional con recursos mínimos, ideal para un proyecto universitario que demuestra conocimientos actuales de la industria.

---

[← Arquitectura del Sistema](02-ARQUITECTURA_SISTEMA.md) | [Volver al Índice](README.md) | [Siguiente: Base de Datos →](04-BASE_DE_DATOS.md)
