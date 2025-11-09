# Documentación de Arquitectura: Sistema de Asistencia con QR

## 1. Introducción

Este documento describe la arquitectura completa del **Sistema de Asistencia con QR**, una aplicación web construida bajo el patrón **MVC (Model-View-Controller)** que permite a docentes generar códigos QR para tomar asistencia y a estudiantes registrarse escaneando dichos códigos.

### Objetivo Principal
Automatizar el proceso de toma de asistencia en instituciones educativas mediante tecnología QR, reduciendo fraude y mejorando la eficiencia administrativa.

### Stack Tecnológico
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Supabase (PostgreSQL) con Row Level Security
- **Hosting**: Vercel
- **Autenticación**: Supabase Auth con sesiones basadas en cookies
- **Base de Datos**: Supabase PostgreSQL con RLS
- **QR**: Generación con `qrcode`, escaneo con `@zxing/browser`

### URL de Producción
- **App**: https://v0-student-attendance-app-fawn.vercel.app
- **Supabase Project**: https://supabase.com/dashboard/project/elthoicbggstbrjsxuog

---

## 2. Estructura MVC

### 2.1 MODELS (Capa de Datos)

#### 2.1.1 Tablas de Base de Datos

**Tabla: `profiles`** (Perfiles de usuario - extiende auth.users)
- `id` (UUID, PK, FK → auth.users.id)
- `email` (String, unique)
- `full_name` (String)
- `role` (enum: 'student', 'teacher')
- `created_at` (Timestamp)

**Tabla: `subjects`** (Materias)
- `id` (UUID, PK)
- `teacher_id` (UUID, FK → auth.users.id)
- `name` (String) - Nombre de la materia
- `code` (String, unique) - Código único de materia
- `schedule` (String, nullable) - Horario (e.g., "Lunes 10:00-12:00")
- `description` (Text, nullable)
- `created_at` (Timestamp)

**Tabla: `enrollments`** (Relación M2M: Estudiantes - Materias)
- `id` (UUID, PK)
- `student_id` (UUID, FK → auth.users.id)
- `subject_id` (UUID, FK → subjects.id)
- `enrolled_at` (Timestamp)

**Tabla: `attendance_sessions`** (Sesiones de asistencia con QR)
- `id` (UUID, PK)
- `subject_id` (UUID, FK → subjects.id)
- `qr_code` (String, unique) - Código QR único
- `expires_at` (Timestamp) - Expiración automática de sesión
- `created_at` (Timestamp)

**Notas de diseño:**
- No se almacena `teacher_id` en sessions (se obtiene via `subjects.teacher_id`)
- No se usa campo `status` - la validación se hace comparando `expires_at > NOW()`
- Sesiones expiran automáticamente después de 30 minutos por defecto

**Tabla: `attendance_records`** (Registros de asistencia)
- `id` (UUID, PK)
- `session_id` (UUID, FK → attendance_sessions.id)
- `student_id` (UUID, FK → auth.users.id)
- `subject_id` (UUID, FK → subjects.id)
- `scanned_at` (Timestamp)
- `UNIQUE(session_id, student_id)` - Previene duplicados

**Notas de diseño:**
- Se almacena `subject_id` redundantemente para queries más rápidas
- Constraint UNIQUE previene que un estudiante registre asistencia dos veces en la misma sesión

#### 2.1.2 Servicios de Datos (Data Services)

Ubicación: `/lib/services/`

Los servicios encapsulan toda la lógica de acceso a datos y proporcionan una API tipada para las operaciones de base de datos.

**`auth.service.ts`**: Autenticación y gestión de perfiles
```typescript
class AuthService {
  login(email: string, password: string): Promise<{ user: User; role: UserRole }>
  register(email: string, password: string, fullName: string, role: UserRole): Promise<void>
  getCurrentUser(): Promise<User | null>
  getUserProfile(userId: string): Promise<Profile>
  verifyUserRole(userId: string, expectedRole: UserRole): Promise<boolean>
  logout(): Promise<void>
}
```

**`subject.service.ts`**: Operaciones CRUD para materias
```typescript
class SubjectService {
  getSubjectsByTeacher(teacherId: string): Promise<Subject[]>
  getAllSubjects(): Promise<Subject[]>
  getSubjectById(subjectId: string): Promise<Subject | null>
  createSubject(data: CreateSubjectDTO): Promise<Subject>
  updateSubject(subjectId: string, data: UpdateSubjectDTO): Promise<Subject>
  deleteSubject(subjectId: string): Promise<void>
  verifyTeacherOwnsSubject(teacherId: string, subjectId: string): Promise<boolean>
}
```

**`enrollment.service.ts`**: Gestión de inscripciones
```typescript
class EnrollmentService {
  getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithSubject[]>
  getEnrollmentsBySubject(subjectId: string): Promise<EnrollmentWithProfile[]>
  getEnrolledSubjectIds(studentId: string): Promise<string[]>
  checkEnrollment(studentId: string, subjectId: string): Promise<Enrollment | null>
  enrollStudent(studentId: string, subjectId: string): Promise<Enrollment>
  enrollStudentByEmail(email: string, subjectId: string): Promise<Enrollment>
  unenrollStudent(enrollmentId: string): Promise<void>
  isStudentEnrolled(studentId: string, subjectId: string): Promise<boolean>
}
```

**`attendance-session.service.ts`**: Gestión de sesiones de asistencia
```typescript
class AttendanceSessionService {
  getActiveSessionsByTeacher(teacherId: string): Promise<AttendanceSessionWithSubject[]>
  getSessionByQRCode(qrCode: string): Promise<AttendanceSessionWithSubject | null>
  getSessionById(sessionId: string): Promise<AttendanceSession | null>
  createSession(subjectId: string, expiresInMinutes: number): Promise<AttendanceSession>
  endSession(sessionId: string): Promise<void>
  isSessionValid(sessionId: string): Promise<boolean>
  getAttendanceCount(sessionId: string): Promise<number>
}
```

**`attendance-record.service.ts`**: Registros de asistencia
```typescript
class AttendanceRecordService {
  getRecordsByStudent(studentId: string): Promise<AttendanceRecordWithSubject[]>
  getRecordsByTeacher(teacherId: string, filters?: AttendanceFilters): Promise<AttendanceRecordFull[]>
  checkAttendance(sessionId: string, studentId: string): Promise<AttendanceRecord | null>
  recordAttendance(data: RecordAttendanceDTO): Promise<AttendanceRecord>
  hasAttendedSession(sessionId: string, studentId: string): Promise<boolean>
}
```

#### 2.1.3 Seguridad - Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas implementadas son:

**Profiles:**
```sql
-- Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "Users manage own profile"
ON profiles FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

**Subjects:**
```sql
-- Profesores gestionan sus propias materias
CREATE POLICY "Teachers manage own subjects"
ON subjects FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Estudiantes pueden ver todas las materias (para inscribirse)
CREATE POLICY "Students view all subjects"
ON subjects FOR SELECT
TO authenticated
USING (true);
```

**Enrollments:**
```sql
-- Profesores gestionan inscripciones de sus materias
CREATE POLICY "Teachers manage enrollments"
ON enrollments FOR ALL
TO authenticated
USING (subject_id IN (SELECT id FROM subjects WHERE teacher_id = auth.uid()));

-- Estudiantes ven y gestionan sus propias inscripciones
CREATE POLICY "Students manage own enrollments"
ON enrollments FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());
```

**Attendance Sessions:**
```sql
-- Profesores gestionan sesiones de sus materias
CREATE POLICY "Teachers manage sessions"
ON attendance_sessions FOR ALL
TO authenticated
USING (subject_id IN (SELECT id FROM subjects WHERE teacher_id = auth.uid()))
WITH CHECK (subject_id IN (SELECT id FROM subjects WHERE teacher_id = auth.uid()));

-- Estudiantes ven sesiones activas de materias en las que están inscritos
CREATE POLICY "Students view active sessions"
ON attendance_sessions FOR SELECT
TO authenticated
USING (
  expires_at > NOW() AND
  subject_id IN (SELECT subject_id FROM enrollments WHERE student_id = auth.uid())
);
```

**Attendance Records:**
```sql
-- Estudiantes insertan sus propios registros
CREATE POLICY "Students record own attendance"
ON attendance_records FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Estudiantes ven sus propios registros
CREATE POLICY "Students view own records"
ON attendance_records FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Profesores ven registros de sus materias
CREATE POLICY "Teachers view subject records"
ON attendance_records FOR SELECT
TO authenticated
USING (subject_id IN (SELECT id FROM subjects WHERE teacher_id = auth.uid()));
```

---

### 2.2 VIEWS (Capa de Presentación)

Ubicación: `/app/` (Next.js App Router)

#### 2.2.1 Estructura de Rutas

```
/app
  /auth
    /login
      /page.tsx          → Página de login
    /register
      /page.tsx          → Registro de usuarios
    /verify-email
      /page.tsx          → Verificación de email

  /teacher
    /layout.tsx          → Layout con navegación de profesor
    /page.tsx            → Dashboard principal docente
    /qr
      /page.tsx          → Generador de QR y sesiones activas
    /reports
      /page.tsx          → Reportes de asistencia

  /student
    /layout.tsx          → Layout con navegación de estudiante
    /page.tsx            → Dashboard estudiante
    /subjects
      /page.tsx          → Navegación e inscripción a materias
    /history
      /page.tsx          → Historial de asistencias

  /layout.tsx            → Root layout
  /page.tsx              → Landing page
  /globals.css           → Estilos globales Tailwind
```

#### 2.2.2 Componentes Principales

**Layout Components:**
- `/app/teacher/layout.tsx` - Layout con navegación para profesores
- `/app/student/layout.tsx` - Layout con navegación para estudiantes
- `/app/layout.tsx` - Root layout con theme provider

**Subject Management Components** (`/components/`)
- `subjects-list.tsx` - Lista de materias del profesor
- `create-subject-dialog.tsx` - Modal para crear materia
- `edit-subject-dialog.tsx` - Modal para editar materia
- `delete-subject-dialog.tsx` - Confirmación de eliminación
- `available-subjects-list.tsx` - Materias disponibles para estudiantes
- `enrolled-subjects-list.tsx` - Materias inscritas del estudiante

**QR Components** (`/components/`)
- `qr-generator-card.tsx` - Generador de códigos QR
- `qr-scanner-dialog.tsx` - Modal de escaneo con cámara
- `qr-scanner-button.tsx` - Botón para activar escáner
- `view-qr-dialog.tsx` - Visualización de QR generado
- `active-sessions-card.tsx` - Lista de sesiones activas

**Enrollment Components** (`/components/`)
- `manage-enrollments-dialog.tsx` - Gestión de estudiantes inscritos

**Attendance & Reports** (`/components/`)
- `attendance-history.tsx` - Historial de asistencias del estudiante
- `attendance-report-table.tsx` - Tabla de reportes del profesor
- `reports-filter.tsx` - Filtros para reportes

**Navigation** (`/components/`)
- `teacher-nav.tsx` - Navegación del profesor
- `student-nav.tsx` - Navegación del estudiante

**UI Components** (`/components/ui/`)
- Componentes de shadcn/ui: `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `textarea.tsx`

#### 2.2.3 Patrón de Componentes

Los componentes siguen el patrón de separación estricta de responsabilidades:

**Server Components (Pages):**
```typescript
// /app/teacher/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function TeacherDashboard() {
  // Fetch data via API routes (usando fetch en server component)
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subjects?teacherId=${userId}`)
  const { subjects } = await response.json()

  return (
    <div>
      {/* Renderizar UI con datos */}
    </div>
  )
}
```

**Client Components:**
```typescript
// /components/create-subject-dialog.tsx
"use client"
import { useState } from "react"

export default function CreateSubjectDialog() {
  const handleSubmit = async (data: FormData) => {
    // Llamar a API route
    const response = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      // Actualizar UI
      router.refresh()
    }
  }

  return <Dialog>{/* UI */}</Dialog>
}
```

---

### 2.3 CONTROLLERS (Capa de Lógica)

Ubicación: `/app/api/` (API Routes)

Los controladores implementan la lógica de negocio y coordinan entre la capa de Vista y la capa de Modelo.

#### 2.3.1 API Routes - Autenticación

**`/api/auth/login/route.ts`**
- **Método**: POST
- **Request**: `{ email: string, password: string }`
- **Response**: `{ user: User, role: UserRole, redirectPath: string }`
- **Lógica**:
  1. Validar credenciales con Supabase Auth
  2. Obtener rol del usuario desde `profiles`
  3. Retornar ruta de redirección según rol

**`/api/auth/register/route.ts`**
- **Método**: POST
- **Request**: `{ email: string, password: string, fullName: string, role: UserRole }`
- **Response**: `{ success: boolean }`
- **Lógica**:
  1. Crear usuario en Supabase Auth
  2. Trigger automático crea perfil en `profiles`
  3. Enviar email de verificación

**`/api/auth/me/route.ts`**
- **Método**: GET
- **Response**: `{ user: User, profile: Profile }`
- **Lógica**: Retornar usuario autenticado y su perfil

#### 2.3.2 API Routes - Materias

**`/api/subjects/route.ts`**
- **GET**: Listar materias
  - Query params: `?teacherId=xxx` (opcional)
  - Response: `{ subjects: Subject[] }`
  - Si `teacherId` se proporciona: solo materias del profesor
  - Si no: todas las materias (para estudiantes)

- **POST**: Crear nueva materia
  - Request: `{ name: string, code: string, schedule?: string, description?: string }`
  - Response: `{ subject: Subject }`
  - Validación: Usuario debe ser profesor

**`/api/subjects/[id]/route.ts`**
- **GET**: Obtener materia por ID
  - Response: `{ subject: Subject }`

- **PATCH**: Actualizar materia
  - Request: `{ name?: string, code?: string, schedule?: string, description?: string }`
  - Response: `{ subject: Subject }`
  - Validación: Profesor debe ser dueño de la materia

- **DELETE**: Eliminar materia
  - Response: `{ success: boolean }`
  - Validación: Profesor debe ser dueño de la materia
  - Nota: Cascade delete elimina enrollments, sessions y records

#### 2.3.3 API Routes - Inscripciones

**`/api/enrollments/route.ts`**
- **GET**: Listar inscripciones
  - Query params: `?studentId=xxx` o `?subjectId=xxx`
  - Response: `{ enrollments: Enrollment[] }`
  - Con `studentId`: materias del estudiante (con datos de subject)
  - Con `subjectId`: estudiantes de la materia (con datos de profile)

- **POST**: Crear inscripción
  - Request: `{ studentId?: string, email?: string, subjectId: string }`
  - Response: `{ enrollment: Enrollment }`
  - Si `email`: buscar estudiante y crear enrollment
  - Si `studentId`: crear enrollment directamente
  - Validación: No duplicados

**`/api/enrollments/[id]/route.ts`**
- **DELETE**: Eliminar inscripción
  - Response: `{ success: boolean }`
  - Validación: Profesor dueño de la materia o estudiante propio

**`/api/enrollments/check/route.ts`**
- **GET**: Verificar si estudiante está inscrito
  - Query params: `?studentId=xxx&subjectId=xxx`
  - Response: `{ isEnrolled: boolean, enrollment?: Enrollment }`

#### 2.3.4 API Routes - Sesiones de Asistencia

**`/api/attendance-sessions/route.ts`**
- **GET**: Listar sesiones activas
  - Query params: `?teacherId=xxx`
  - Response: `{ sessions: AttendanceSessionWithSubject[] }`
  - Filtra por `expires_at > NOW()`

- **POST**: Crear nueva sesión (generar QR)
  - Request: `{ subjectId: string, expiresInMinutes: number }`
  - Response: `{ session: AttendanceSession }`
  - Lógica:
    1. Verificar que profesor es dueño de la materia
    2. Generar QR code único: `${subjectId}-${timestamp}-${random}`
    3. Calcular `expires_at` = `NOW() + expiresInMinutes`
    4. Insertar en BD
    5. Retornar sesión

**`/api/attendance-sessions/[id]/route.ts`**
- **PATCH**: Actualizar sesión (terminar anticipadamente)
  - Request: `{ action: "end" }`
  - Response: `{ success: boolean }`
  - Lógica: Actualizar `expires_at` a `NOW()`

**`/api/attendance-sessions/validate/route.ts`**
- **POST**: Validar QR code
  - Request: `{ qrCode: string, studentId: string }`
  - Response: `{ valid: boolean, session?: AttendanceSessionWithSubject, errors?: string[] }`
  - Validaciones:
    1. Sesión existe
    2. No ha expirado (`expires_at > NOW()`)
    3. Estudiante está inscrito en la materia
    4. No ha registrado asistencia previamente
  - Retorna errores específicos si falla alguna validación

#### 2.3.5 API Routes - Registros de Asistencia

**`/api/attendance-records/route.ts`**
- **GET**: Obtener registros
  - Query params:
    - `?studentId=xxx` - Historial del estudiante
    - `?teacherId=xxx&subjectId=xxx&fromDate=xxx&toDate=xxx` - Reportes del profesor
  - Response: `{ records: AttendanceRecord[] }`

- **POST**: Registrar asistencia (al escanear QR)
  - Request: `{ qrCode: string, studentId: string }`
  - Response: `{ record: AttendanceRecord }`
  - Lógica:
    1. Validar QR usando `/api/attendance-sessions/validate`
    2. Si válido, insertar en `attendance_records`
    3. Retornar registro creado
  - Constraint UNIQUE previene duplicados

#### 2.3.6 Middleware

**`/middleware.ts`** - Protección de rutas autenticadas
```typescript
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase session
  const response = await updateSession(request)

  // 2. Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Redirigir si no autenticado
  if (!user && isProtectedRoute) {
    return NextResponse.redirect("/auth/login")
  }

  // 4. Verificar rol y redirigir si es incorrecto
  const profile = await getUserProfile(user.id)
  if (isTeacherRoute && profile.role !== "teacher") {
    return NextResponse.redirect("/student")
  }

  return response
}
```

**Configuración:**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 3. Flujo de Datos

### 3.1 Flujo: Generación y Escaneo de QR

```
1. DOCENTE genera QR
   ↓
   Usuario selecciona materia y tiempo de expiración
   ↓
   Component: qr-generator-card.tsx
   → POST /api/attendance-sessions
   ↓
   API Route valida que usuario es profesor dueño de la materia
   ↓
   Service: AttendanceSessionService.createSession()
   → Genera QR único: "${subjectId}-${timestamp}-${random}"
   → Calcula expires_at
   → Inserta en attendance_sessions
   ↓
   Retorna session con qr_code
   ↓
   Component recibe qr_code
   → Utility: QRService.generateQRImage(qrCode)
   → Renderiza QR en canvas usando biblioteca qrcode
   ↓
   Usuario ve QR en pantalla con countdown timer

2. ESTUDIANTE escanea QR
   ↓
   Usuario abre escáner
   ↓
   Component: qr-scanner-dialog.tsx
   → Solicita permisos de cámara
   → Inicializa ZXing BrowserMultiFormatReader
   → Detecta código QR
   ↓
   QR detectado: extrae qrCode string
   ↓
   Component llama a API
   → POST /api/attendance-records { qrCode, studentId }
   ↓
   API Route ejecuta validaciones:
   1. Service: AttendanceSessionService.getSessionByQRCode(qrCode)
      → Verifica sesión existe
   2. Valida expires_at > NOW()
      → Verifica no expirado
   3. Service: EnrollmentService.isStudentEnrolled(studentId, subjectId)
      → Verifica inscripción
   4. Service: AttendanceRecordService.hasAttendedSession(sessionId, studentId)
      → Verifica no duplicado
   ↓
   Si todas las validaciones pasan:
   → Service: AttendanceRecordService.recordAttendance()
   → Inserta en attendance_records
   ↓
   Retorna registro exitoso
   ↓
   Component muestra confirmación visual
   → "Asistencia registrada exitosamente"
```

### 3.2 Flujo de Autenticación

```
1. Usuario ingresa email/contraseña en /auth/login
   ↓
2. Component llama POST /api/auth/login
   ↓
3. API Route:
   → Service: AuthService.login(email, password)
   → Supabase Auth valida credenciales
   → Obtiene perfil: AuthService.getUserProfile(userId)
   ↓
4. Retorna { user, role, redirectPath }
   ↓
5. Supabase Auth almacena JWT en cookie HttpOnly
   ↓
6. Component redirige según rol:
   → teacher → /teacher
   → student → /student
   ↓
7. En cada request subsecuente:
   → Middleware verifica session
   → Middleware valida rol
   → RLS policies validan acceso a datos
```

### 3.3 Flujo de Creación de Materia

```
1. Profesor hace clic en "Crear Materia"
   ↓
2. Component: create-subject-dialog.tsx
   → Formulario con validación client-side
   ↓
3. Al submit:
   → POST /api/subjects { name, code, schedule, description }
   ↓
4. API Route:
   → Verifica auth y rol de profesor
   → Service: SubjectService.createSubject(data)
   → Inserta en tabla subjects con teacher_id = auth.uid()
   ↓
5. RLS Policy valida que teacher_id = auth.uid()
   ↓
6. Retorna subject creada
   ↓
7. Component cierra modal y refresca lista
   → router.refresh()
```

### 3.4 Flujo de Inscripción (Auto-enrollment)

```
1. Estudiante navega a /student/subjects
   ↓
2. Page fetch materias disponibles
   → GET /api/subjects
   ↓
3. Component: available-subjects-list.tsx
   → Muestra lista de materias
   → Para cada materia, verifica si está inscrito
   → GET /api/enrollments/check?studentId=xxx&subjectId=xxx
   ↓
4. Estudiante hace clic en "Inscribirse"
   ↓
5. Component llama:
   → POST /api/enrollments { studentId, subjectId }
   ↓
6. API Route:
   → Verifica que no existe enrollment duplicado
   → Service: EnrollmentService.enrollStudent(studentId, subjectId)
   → Inserta en enrollments
   ↓
7. RLS Policy valida student_id = auth.uid()
   ↓
8. Retorna enrollment
   ↓
9. Component actualiza UI mostrando "Inscrito"
```

---

## 4. Utilidades QR

Ubicación: `/lib/qr/`

### 4.1 QR Generator (`/lib/qr/generator.ts`)

```typescript
export class QRService {
  /**
   * Genera un código QR único
   * Formato: ${subjectId}-${timestamp}-${random}
   */
  static generateQRCode(subjectId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    return `${subjectId}-${timestamp}-${random}`
  }

  /**
   * Genera imagen QR como base64
   * Para visualización en frontend
   */
  static async generateQRImage(qrCode: string): Promise<string> {
    // Usa biblioteca 'qrcode'
    return await QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    })
  }

  /**
   * Parsea un código QR
   * Extrae subject_id del formato
   */
  static parseQRCode(qrCode: string): { subjectId: string; timestamp: number } {
    const [subjectId, timestampStr] = qrCode.split('-')
    return {
      subjectId,
      timestamp: parseInt(timestampStr)
    }
  }

  /**
   * Valida formato de QR code
   */
  static isValidQRFormat(qrCode: string): boolean {
    const parts = qrCode.split('-')
    return parts.length === 3 && !isNaN(parseInt(parts[1]))
  }
}
```

### 4.2 QR Scanner (`/lib/qr/scanner.ts`)

```typescript
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser'

export class QRScanner {
  /**
   * Inicializa escáner de cámara
   * Usa ZXing BrowserMultiFormatReader
   */
  static async initScanner(
    videoElement: HTMLVideoElement,
    onDecode: (result: string) => void,
    onError: (error: Error) => void
  ): Promise<IScannerControls> {
    const codeReader = new BrowserMultiFormatReader()

    const controls = await codeReader.decodeFromVideoDevice(
      undefined, // deviceId (undefined = default)
      videoElement,
      (result, error) => {
        if (result) {
          onDecode(result.getText())
        }
        if (error) {
          onError(error)
        }
      }
    )

    return controls
  }

  /**
   * Detiene el escáner y libera cámara
   */
  static stopScanner(controls: IScannerControls): void {
    controls.stop()
  }

  /**
   * Obtiene lista de cámaras disponibles
   */
  static async getCameras(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'videoinput')
  }
}
```

---

## 5. Configuración Vercel + Supabase

### 5.1 Variables de Entorno

**`.env.local` (desarrollo local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://elthoicbggstbrjsxuog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Vercel Project Settings**
- Variables configuradas en: Settings → Environment Variables
- Usar Supabase Integration para sincronización automática
- Variables de producción:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_URL=https://v0-student-attendance-app-fawn.vercel.app`

### 5.2 Deployment Steps

1. Push código a GitHub (branch: `main`)
2. Vercel detecta cambios automáticamente
3. Build automático:
   - `npm run build`
   - Next.js genera archivos estáticos
   - API Routes se despliegan como Serverless Functions
4. Deploy a producción
5. Cada push a `main` redeploy automático

### 5.3 Supabase Client Configuration

**Browser Client (`/lib/supabase/client.ts`)**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client (`/lib/supabase/server.ts`)**
```typescript
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

**Nota importante:** El server client debe ser async en Next.js 16.

---

## 6. Seguridad

### 6.1 Autenticación y Autorización

**Autenticación:**
- Supabase Auth con JWT tokens
- Tokens almacenados en cookies HttpOnly
- Session refresh automático via middleware

**Autorización:**
- Row Level Security (RLS) en todas las tablas
- Validación de rol en middleware
- Validación de propiedad en API routes

### 6.2 Validaciones

**Client-side:**
- Validación de formularios con React Hook Form
- Type checking con TypeScript
- Feedback inmediato al usuario

**Server-side:**
- Validación de datos en API routes
- Verificación de autenticación
- Verificación de autorización (rol y propiedad)
- RLS como última capa de defensa

**Ejemplos:**
```typescript
// API Route validation pattern
export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Role check
  const profile = await AuthService.getUserProfile(user.id)
  if (profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Input validation
  const body = await request.json()
  if (!body.subjectId) {
    return NextResponse.json({ error: 'Missing subjectId' }, { status: 400 })
  }

  // 4. Ownership check
  const isOwner = await SubjectService.verifyTeacherOwnsSubject(user.id, body.subjectId)
  if (!isOwner) {
    return NextResponse.json({ error: 'Not owner of subject' }, { status: 403 })
  }

  // 5. Business logic
  // ... RLS provides final security layer
}
```

### 6.3 Mejores Prácticas Implementadas

1. **Nunca confiar en datos del cliente**
   - Todas las operaciones validadas server-side
   - RLS como capa adicional de seguridad

2. **Principio de menor privilegio**
   - Usuarios solo acceden a sus propios datos
   - RLS policies específicas por rol

3. **Defense in depth**
   - Múltiples capas: Client validation → API validation → RLS

4. **Secure by default**
   - RLS habilitado en todas las tablas
   - Policies explícitas (deny by default)

---

## 7. Performance y Escalabilidad

### 7.1 Optimizaciones Implementadas

**Next.js Caching:**
```typescript
// Server Component con caching
export const revalidate = 60 // Revalidar cada 60 segundos

export default async function Page() {
  const data = await fetch('/api/subjects', {
    next: { revalidate: 60 }
  })
}
```

**Supabase:**
- Connection pooling automático
- Índices en foreign keys
- RLS compilado a SQL (no overhead significativo)

**Frontend:**
- Lazy loading de componentes
- Optimistic updates en mutaciones
- Client-side caching con router

### 7.2 Límites Esperados

Con la arquitectura actual:
- **Usuarios concurrentes:** 1,000+
- **Materias totales:** 10,000+
- **Escaneos QR por minuto:** 100+
- **Latencia API routes:** <100ms
- **Latencia QR scan:** <50ms

### 7.3 Estrategias de Escalabilidad

**Horizontal scaling (Vercel):**
- Serverless Functions escalan automáticamente
- Edge Network para bajo latency global

**Database scaling (Supabase):**
- Upgrade plan para más conexiones
- Read replicas para queries pesadas
- Partitioning si > 10M registros

---

## 8. Testing

### 8.1 Unit Tests

**Servicios:**
```typescript
// lib/services/__tests__/subject.service.test.ts
describe('SubjectService', () => {
  it('should create subject with teacher_id', async () => {
    const subject = await SubjectService.createSubject({
      name: 'Math 101',
      code: 'MATH101',
      teacher_id: 'teacher-uuid'
    })
    expect(subject.teacher_id).toBe('teacher-uuid')
  })
})
```

**API Routes:**
```typescript
// app/api/subjects/__tests__/route.test.ts
describe('POST /api/subjects', () => {
  it('should reject non-teacher users', async () => {
    const response = await POST(mockStudentRequest)
    expect(response.status).toBe(403)
  })
})
```

### 8.2 Integration Tests

```typescript
describe('QR Attendance Flow', () => {
  it('should complete full attendance cycle', async () => {
    // 1. Teacher creates session
    const session = await POST('/api/attendance-sessions', {
      subjectId: 'subject-1',
      expiresInMinutes: 30
    })

    // 2. Student scans QR
    const record = await POST('/api/attendance-records', {
      qrCode: session.qr_code,
      studentId: 'student-1'
    })

    // 3. Verify record created
    expect(record.student_id).toBe('student-1')
  })
})
```

### 8.3 E2E Tests (Playwright)

```typescript
test('Teacher can generate QR and student can scan', async ({ page }) => {
  // Login as teacher
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'teacher@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to QR page
  await page.goto('/teacher/qr')

  // Generate QR
  await page.click('button:has-text("Generar QR")')
  await expect(page.locator('canvas')).toBeVisible()

  // ... student scan flow
})
```

---

## 9. Mantenimiento y Monitoreo

### 9.1 Logs y Debugging

**Vercel Logs:**
- Acceder a logs en tiempo real en Vercel Dashboard
- Filtrar por API route o error level

**Supabase Logs:**
- Query performance en Dashboard → Database → Query Performance
- Auth logs en Dashboard → Authentication → Logs

**Console logging pattern:**
```typescript
// Structured logging en API routes
console.log({
  route: '/api/attendance-records',
  method: 'POST',
  userId: user.id,
  timestamp: new Date().toISOString(),
  action: 'record_attendance'
})
```

### 9.2 Migraciones de Base de Datos

**Ubicación:** `/supabase/migrations/`

**Proceso:**
1. Escribir SQL migration en `/supabase/migrations/YYYYMMDD_description.sql`
2. Aplicar manualmente en Supabase SQL Editor
3. Documentar en `APPLY_ALL_MIGRATIONS.sql`
4. Commit a repo

**Importante:**
- Nunca modificar migraciones ya aplicadas
- Siempre usar transacciones
- Probar en desarrollo antes de producción

### 9.3 Backup y Recovery

**Supabase automatic backups:**
- Daily backups automáticos
- Retention según plan
- Point-in-time recovery disponible

**Manual backup:**
```bash
# Exportar datos
supabase db dump -f backup.sql

# Restaurar
supabase db reset
psql -f backup.sql
```

---

## 10. Roadmap Futuro

### Próximas Funcionalidades

- [ ] **Notificaciones en tiempo real**
  - Websockets para notificar cuando se genera nuevo QR
  - Push notifications en PWA

- [ ] **Analytics y Reportes Avanzados**
  - Gráficos de asistencia por materia
  - Exportación a Excel/PDF
  - Predicción de ausentismo con ML

- [ ] **Integración con Sistemas Externos**
  - Google Classroom sync
  - Canvas LMS integration
  - API pública para terceros

- [ ] **Features de Seguridad**
  - Geolocalización obligatoria
  - Detección de QR compartidos (IP tracking)
  - Two-factor authentication

- [ ] **Mobile App Nativa**
  - React Native app
  - Mejor experiencia de cámara
  - Offline support

- [ ] **Mejoras de UX**
  - Dark mode
  - Internacionalización (i18n)
  - Accesibilidad (WCAG 2.1 AA)

---

## 11. Conclusión

Esta arquitectura MVC proporciona:

✅ **Separación clara de responsabilidades**
- Model: Services encapsulan lógica de datos
- View: Components se enfocan en UI
- Controller: API Routes manejan lógica de negocio

✅ **Seguridad robusta**
- Row Level Security (RLS) en todas las tablas
- Validación en múltiples capas
- Authentication y authorization integradas

✅ **Escalabilidad**
- Serverless architecture en Vercel
- Supabase PostgreSQL con pooling
- Optimizaciones de caching

✅ **Mantenibilidad**
- Código organizado y predecible
- TypeScript para type safety
- Tests unitarios y E2E

✅ **Developer Experience**
- Next.js 16 con App Router
- Hot reload en desarrollo
- Deployment automático

La implementación en **Vercel + Supabase** garantiza alta disponibilidad, bajo costo operativo y facilidad de mantenimiento, siendo ideal para instituciones educativas de todos los tamaños.
