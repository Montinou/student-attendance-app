# Documentación de Arquitectura: Sistema de Asistencia con QR

## 1. Introducción

Este documento describe la arquitectura completa del **Sistema de Asistencia con QR**, una aplicación web construida bajo el patrón **MVC (Model-View-Controller)** que permite a docentes generar códigos QR para tomar asistencia y a estudiantes registrarse escaneando dichos códigos.

### Objetivo Principal
Automatizar el proceso de toma de asistencia en instituciones educativas mediante tecnología QR, reduciendo fraude y mejorando la eficiencia administrativa.

### Stack Tecnológico
- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Edge Functions
- **Hosting**: Vercel
- **Autenticación**: Supabase Auth (JWT)
- **Base de Datos**: Supabase PostgreSQL con RLS
- **QR**: Generación con `qrcode` npm, escaneo con `html5-qrcode`

---

## 2. Estructura MVC

### 2.1 MODELS (Capa de Datos)

#### 2.1.1 Tablas de Base de Datos

**Tabla: `users`** (Gestiona por Supabase Auth)
- `id` (UUID, PK) - ID de usuario autogenerado por Supabase
- `email` (String, unique)
- `role` (enum: 'student', 'teacher', 'admin')
- `name` (String)
- `created_at` (Timestamp)

**Tabla: `subjects`** (Materias)
- `id` (UUID, PK)
- `teacher_id` (UUID, FK -> users.id)
- `name` (String) - Nombre de la materia
- `code` (String, unique) - Código único de materia
- `schedule` (String) - Horario (e.g., "Lunes 10:00-12:00")
- `description` (Text)
- `created_at` (Timestamp)

**Tabla: `student_subjects`** (Relación M2M: Estudiantes - Materias)
- `id` (UUID, PK)
- `student_id` (UUID, FK -> users.id)
- `subject_id` (UUID, FK -> subjects.id)
- `enrolled_at` (Timestamp)

**Tabla: `attendance_sessions`** (Sesiones de asistencia con QR)
- `id` (UUID, PK)
- `subject_id` (UUID, FK -> subjects.id)
- `teacher_id` (UUID, FK -> users.id)
- `qr_code` (String) - Código QR único
- `session_date` (Date)
- `session_time` (Time)
- `status` (enum: 'active', 'closed') - Si está abierta o cerrada
- `created_at` (Timestamp)

**Tabla: `attendance_records`** (Registros de asistencia)
- `id` (UUID, PK)
- `session_id` (UUID, FK -> attendance_sessions.id)
- `student_id` (UUID, FK -> users.id)
- `checked_in_at` (Timestamp)
- `ip_address` (String) - Para auditoría
- `latitude` (Float, nullable)
- `longitude` (Float, nullable)

#### 2.1.2 Servicios de Datos (Data Services)

Ubicación: `/src/lib/services/`

**`userService.ts`**: Operaciones CRUD para usuarios
**`subjectService.ts`**: Operaciones para materias
**`attendanceService.ts`**: Lógica de asistencia, QR y registros
**`supabaseClient.ts`**: Cliente Supabase configurado

#### 2.1.3 Seguridad - Row Level Security (RLS)

Políticas activas:

```sql
-- Profesores solo pueden ver sus propias materias
CREATE POLICY "Teachers view own subjects" 
ON subjects FOR SELECT 
TO authenticated 
USING (teacher_id = auth.uid());

-- Estudiantes solo ven sus asistencias
CREATE POLICY "Students view own attendance" 
ON attendance_records FOR SELECT 
TO authenticated 
USING (student_id = auth.uid());

-- Solo profesores pueden crear sesiones de asistencia
CREATE POLICY "Teachers create sessions" 
ON attendance_sessions FOR INSERT 
TO authenticated 
WITH CHECK (teacher_id = auth.uid());
```

---

### 2.2 VIEWS (Capa de Presentación)

Ubicación: `/src/app/` (Next.js App Router)

#### 2.2.1 Estructura de Rutas

```
/app
  /auth
    /login               → Página de login
    /signup              → Registro
    /confirm             → Confirmación de email
  /dashboard
    /teacher
      /page.tsx          → Dashboard principal docente
      /subjects          → Gestión de materias
      /generate-qr       → Generador de QR
      /attendance        → Visualización de asistencias
      /reports           → Reportes
    /student
      /page.tsx          → Dashboard estudiante
      /scan-qr           → Escáner QR
      /my-attendance     → Mis asistencias
  /admin
    /users               → Gestión de usuarios
    /subjects            → Gestión de materias globales
```

#### 2.2.2 Componentes Principales

**Layout Components** (`/src/components/layouts/`)
- `DashboardLayout.tsx` - Layout general con sidebar
- `AuthLayout.tsx` - Layout para páginas de autenticación

**Feature Components** (`/src/components/features/`)
- `QRGenerator.tsx` - Generador y visualizador de QR
- `QRScanner.tsx` - Modal de escaneo con cámara
- `AttendanceTable.tsx` - Tabla de asistencias
- `SubjectCard.tsx` - Tarjeta de materia
- `AttendanceHistory.tsx` - Historial de asistencias

**UI Components** (`/src/components/ui/`)
- Componentes de shadcn/ui: Button, Input, Card, Modal, etc.

#### 2.2.3 Página de Ejemplo: Dashboard Docente

```tsx
// /src/app/dashboard/teacher/page.tsx
'use client';

export default function TeacherDashboard() {
  // Fetches subjects from backend (getSubjects)
  // Displays list of subjects in grid
  // Shows "Generate QR" button
  // Shows "View Attendance" link
}
```

---

### 2.3 CONTROLLERS (Capa de Lógica)

Ubicación: `/src/app/api/routes/` (API Routes) y `/src/actions/` (Server Actions)

#### 2.3.1 API Routes

**`/api/auth/[...auth].ts`** - Rutas de autenticación (Supabase)

**`/api/subjects/route.ts`**
- `GET` - Listar materias del usuario
- `POST` - Crear nueva materia

**`/api/attendance-sessions/route.ts`**
- `GET` - Listar sesiones
- `POST` - Crear nueva sesión (genera QR)
- `PATCH` - Actualizar estado de sesión

**`/api/attendance-records/route.ts`**
- `GET` - Obtener registros de asistencia
- `POST` - Registrar asistencia (al escanear QR)

**`/api/qr-verification/route.ts`**
- `POST` - Verificar QR válido y no expirado

#### 2.3.2 Server Actions

Ubicación: `/src/actions/`

```typescript
// attendanceActions.ts
'use server'

export async function createAttendanceSession(subjectId: string) {
  // 1. Validate teacher ownership
  // 2. Generate unique QR code
  // 3. Create session in database
  // 4. Return QR data
}

export async function verifyAndRecordAttendance(
  sessionId: string,
  studentId: string
) {
  // 1. Verify session is active
  // 2. Check student is enrolled
  // 3. Check if already attended
  // 4. Record attendance
  // 5. Return success/error
}
```

#### 2.3.3 Middleware

`/src/middleware.ts` - Protección de rutas autenticadas

```typescript
export function middleware(request: NextRequest) {
  // Verify Supabase session
  // Redirect to login if not authenticated
  // Check user role for protected routes
}
```

---

## 3. Flujo de Datos

### 3.1 Flujo: Generación y Escaneo de QR

```
1. DOCENTE genera QR
   ↓
   → POST /api/attendance-sessions
   → Controller crea sesión en DB
   → Genera QR único (ej: "SESSION_abc123def")
   → Retorna código QR al frontend
   → Usuario ve QR en pantalla

2. ESTUDIANTE escanea QR
   ↓
   → Abre escáner (cámara)
   → Detecta código QR
   → Extrae valor: "SESSION_abc123def"
   → POST /api/attendance-records
   → Controller verifica:
      ✓ Sesión existe y está activa
      ✓ Estudiante está inscrito en materia
      ✓ No ha registrado asistencia aún
   → Registra en BD: attendance_records
   → Retorna confirmación visual
```

### 3.2 Flujo de Autenticación

```
1. Usuario ingresa email/contraseña
   ↓
2. Supabase Auth valida credenciales
   ↓
3. JWT token almacenado en cookie HttpOnly
   ↓
4. Middleware verifica token en cada request
   ↓
5. RLS policies validan acceso a datos
```

---

## 4. Configuración Vercel + Supabase

### 4.1 Variables de Entorno

**`.env.local` (local development)**
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

**Vercel Project Settings**
- Agregar las mismas variables en Settings → Environment Variables
- Usar Supabase Integration para sincronización automática

### 4.2 Deployment Steps

1. Push código a GitHub
2. Conectar repo a Vercel
3. Vercel automáticamente configura variables via Supabase Integration
4. Deploy en `main` branch
5. Cada push redeploy automático

---

## 5. Seguridad

### 5.1 RLS Policies
- Cada usuario solo accede sus datos
- Docentes solo ven sus materias y asistencias
- Estudiantes solo ven sus asistencias

### 5.2 Validaciones
- Server-side validation en API routes
- Input sanitization
- Rate limiting en endpoints sensibles (scanning)

### 5.3 Auditoría
- IP address registrada en cada asistencia
- Timestamps en todas las operaciones
- Logs de cambios en usuarios/materias

---

## 6. Escalabilidad y Performance

### 6.1 Optimizaciones
- ISR (Incremental Static Regeneration) para listados
- Revalidation tags para invalidación selectiva
- Índices de base de datos en campos frecuentes
- Connection pooling en Supabase

### 6.2 Límites Esperados
- Soporta 10,000+ estudiantes
- 1,000+ materias simultáneas
- QR scanning con <100ms latencia

---

## 7. Testing

### 7.1 Unit Tests
- Tests para servicios de datos
- Tests para Server Actions
- Cobertura mínima: 80%

### 7.2 E2E Tests
- Flujo completo: login → generar QR → escanear
- Validaciones de seguridad (RLS)
- Casos de error

---

## 8. Roadmap Futuro

- [ ] Notificaciones push en mobile
- [ ] Integración con Google Classroom
- [ ] Análisis predictivo de asistencia
- [ ] App mobile nativa (React Native)
- [ ] Integración de geolocalización obligatoria
- [ ] QR codes dinámicos con expiración por minuto

---

## 9. Conclusión

Esta arquitectura MVC proporciona una base sólida, segura y escalable para un sistema de asistencia moderno. La separación de concerns permite que diferentes equipos trabajen en paralelo, y la implementación en Vercel + Supabase garantiza uptime, seguridad y facilidad de mantenimiento.