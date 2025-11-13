# Documentación de API Endpoints

## 1. Visión General

El Sistema de Asistencia Estudiantil expone una API REST completa a través de Next.js API Routes. Todos los endpoints requieren autenticación mediante JWT en cookies httpOnly.

### Base URL

- **Desarrollo:** `http://localhost:3000/api`
- **Producción:** `https://v0-student-attendance-app-fawn.vercel.app/api`

### Autenticación

Todos los endpoints (excepto auth públicos) requieren:
- Cookie `sb-access-token` válida (JWT)
- Header `Authorization: Bearer {token}` (opcional, alternativa)

### Respuestas Estándar

**Éxito (2xx):**
```json
{
  "data": { /* objeto o array */ },
  "message": "Mensaje opcional"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Mensaje de error descriptivo",
  "code": "ERROR_CODE",
  "details": { /* información adicional */ }
}
```

---

## 2. Endpoints de Autenticación

### 2.1 Registro de Usuario

#### `POST /api/auth/register`

Crea una nueva cuenta de usuario (profesor o estudiante).

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "estudiante@universidad.edu",
  "password": "SecureP@ssw0rd",
  "full_name": "María González",
  "role": "student" // "student" o "teacher"
}
```

**Validaciones:**
- Email válido y único
- Password mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
- full_name mínimo 3 caracteres
- role debe ser "student" o "teacher"

**Respuesta 201 (Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "estudiante@universidad.edu",
    "user_metadata": {
      "full_name": "María González",
      "role": "student"
    }
  },
  "message": "Verifica tu email para activar tu cuenta"
}
```

**Errores:**
- `400` - Validación fallida
- `409` - Email ya registrado

---

### 2.2 Login

#### `POST /api/auth/login`

Autentica un usuario y establece cookies de sesión.

**Body:**
```json
{
  "email": "estudiante@universidad.edu",
  "password": "SecureP@ssw0rd"
}
```

**Respuesta 200 (OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "estudiante@universidad.edu",
    "role": "student"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": 1699876543
  }
}
```

**Nota:** Los tokens también se establecen en cookies httpOnly automáticamente.

**Errores:**
- `400` - Credenciales faltantes
- `401` - Credenciales inválidas
- `403` - Email no verificado

---

### 2.3 Logout

#### `POST /api/auth/logout`

Cierra la sesión del usuario actual.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta 200 (OK):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### 2.4 Verificar Sesión

#### `GET /api/auth/me`

Obtiene información del usuario actualmente autenticado.

**Respuesta 200 (OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "estudiante@universidad.edu",
    "full_name": "María González",
    "role": "student",
    "created_at": "2024-11-13T10:00:00Z"
  }
}
```

**Errores:**
- `401` - No autenticado

---

## 3. Endpoints de Materias (Subjects)

### 3.1 Listar Mis Materias (Profesor)

#### `GET /api/subjects`

Lista todas las materias del profesor autenticado.

**Query Parameters:**
- `include_stats` (boolean) - Incluir conteo de estudiantes

**Respuesta 200 (OK):**
```json
[
  {
    "id": "uuid",
    "name": "Matemáticas Discretas",
    "code": "MAT101",
    "schedule": "Lunes y Miércoles 10:00-12:00",
    "description": "Introducción a la lógica matemática",
    "teacher_id": "uuid",
    "created_at": "2024-11-13T10:00:00Z",
    "student_count": 25 // Si include_stats=true
  }
]
```

**Errores:**
- `401` - No autenticado
- `403` - No es profesor

---

### 3.2 Listar Todas las Materias (Estudiante)

#### `GET /api/subjects/all`

Lista todas las materias disponibles para inscripción.

**Respuesta 200 (OK):**
```json
[
  {
    "id": "uuid",
    "name": "Matemáticas Discretas",
    "code": "MAT101",
    "schedule": "Lunes y Miércoles 10:00-12:00",
    "teacher_name": "Dr. Juan Pérez",
    "is_enrolled": true // true si el estudiante está inscrito
  }
]
```

---

### 3.3 Obtener Materia por ID

#### `GET /api/subjects/:id`

Obtiene detalles de una materia específica.

**Path Parameters:**
- `id` (uuid) - ID de la materia

**Respuesta 200 (OK):**
```json
{
  "id": "uuid",
  "name": "Matemáticas Discretas",
  "code": "MAT101",
  "schedule": "Lunes y Miércoles 10:00-12:00",
  "description": "Introducción a la lógica matemática",
  "teacher_id": "uuid",
  "teacher_name": "Dr. Juan Pérez",
  "created_at": "2024-11-13T10:00:00Z"
}
```

**Errores:**
- `404` - Materia no encontrada
- `403` - No autorizado para ver esta materia

---

### 3.4 Crear Materia

#### `POST /api/subjects`

Crea una nueva materia (solo profesores).

**Body:**
```json
{
  "name": "Matemáticas Discretas",
  "code": "MAT101",
  "schedule": "Lunes y Miércoles 10:00-12:00", // Opcional
  "description": "Introducción a la lógica matemática" // Opcional
}
```

**Respuesta 201 (Created):**
```json
{
  "id": "uuid",
  "name": "Matemáticas Discretas",
  "code": "MAT101",
  "schedule": "Lunes y Miércoles 10:00-12:00",
  "description": "Introducción a la lógica matemática",
  "teacher_id": "uuid",
  "created_at": "2024-11-13T10:00:00Z"
}
```

**Errores:**
- `400` - Validación fallida
- `401` - No autenticado
- `403` - No es profesor

---

### 3.5 Actualizar Materia

#### `PUT /api/subjects/:id`

Actualiza una materia existente (solo el profesor creador).

**Body:** (todos los campos opcionales)
```json
{
  "name": "Matemáticas Discretas Avanzadas",
  "code": "MAT102",
  "schedule": "Martes y Jueves 14:00-16:00",
  "description": "Curso avanzado de lógica"
}
```

**Respuesta 200 (OK):**
```json
{
  "id": "uuid",
  "name": "Matemáticas Discretas Avanzadas",
  "code": "MAT102",
  // ... campos actualizados
}
```

**Errores:**
- `400` - Validación fallida
- `403` - No es el profesor creador
- `404` - Materia no encontrada

---

### 3.6 Eliminar Materia

#### `DELETE /api/subjects/:id`

Elimina una materia (solo el profesor creador).

**Advertencia:** Esto eliminará en cascada:
- Todas las inscripciones
- Todas las sesiones de QR
- Todos los registros de asistencia

**Respuesta 200 (OK):**
```json
{
  "message": "Materia eliminada exitosamente"
}
```

**Errores:**
- `403` - No es el profesor creador
- `404` - Materia no encontrada

---

## 4. Endpoints de Inscripciones (Enrollments)

### 4.1 Listar Estudiantes de una Materia

#### `GET /api/subjects/:subjectId/enrollments`

Lista estudiantes inscritos en una materia (solo el profesor).

**Respuesta 200 (OK):**
```json
[
  {
    "id": "uuid",
    "student_id": "uuid",
    "student_name": "María González",
    "student_email": "maria@universidad.edu",
    "enrolled_at": "2024-11-13T10:30:00Z"
  }
]
```

**Errores:**
- `403` - No es el profesor de la materia
- `404` - Materia no encontrada

---

### 4.2 Inscribir Estudiante (Profesor)

#### `POST /api/subjects/:subjectId/enrollments`

Inscribe un estudiante por email (solo el profesor).

**Body:**
```json
{
  "student_email": "estudiante@universidad.edu"
}
```

**Respuesta 201 (Created):**
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "subject_id": "uuid",
  "enrolled_at": "2024-11-13T10:30:00Z"
}
```

**Errores:**
- `400` - Email inválido
- `403` - No es el profesor de la materia
- `404` - Estudiante no encontrado o no existe
- `409` - Estudiante ya inscrito

---

### 4.3 Auto-Inscripción (Estudiante)

#### `POST /api/enrollments`

Permite a un estudiante inscribirse a sí mismo.

**Body:**
```json
{
  "subject_id": "uuid"
}
```

**Respuesta 201 (Created):**
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "subject_id": "uuid",
  "enrolled_at": "2024-11-13T10:30:00Z"
}
```

**Errores:**
- `400` - subject_id faltante
- `401` - No autenticado
- `403` - No es estudiante
- `404` - Materia no encontrada
- `409` - Ya inscrito

---

### 4.4 Desincribir Estudiante

#### `DELETE /api/subjects/:subjectId/enrollments/:enrollmentId`

Elimina inscripción (profesor puede eliminar cualquiera, estudiante solo la suya).

**Respuesta 200 (OK):**
```json
{
  "message": "Inscripción eliminada exitosamente"
}
```

**Errores:**
- `403` - No autorizado
- `404` - Inscripción no encontrada

---

## 5. Endpoints de Sesiones de QR

### 5.1 Crear Sesión de QR

#### `POST /api/attendance-sessions`

Genera un código QR para asistencia (solo profesores).

**Body:**
```json
{
  "subject_id": "uuid",
  "expires_in_minutes": 10 // 5-60
}
```

**Respuesta 201 (Created):**
```json
{
  "session": {
    "id": "uuid",
    "subject_id": "uuid",
    "subject_name": "Matemáticas Discretas",
    "qr_code": "uuid-1699876543210-x7k2m9p",
    "expires_at": "2024-11-13T10:40:00Z",
    "created_at": "2024-11-13T10:30:00Z"
  },
  "qr_image": "data:image/png;base64,iVBORw0KGgoAAAA..." // Data URL
}
```

**Errores:**
- `400` - Validación fallida (duración inválida)
- `403` - No es el profesor de la materia
- `404` - Materia no encontrada

---

### 5.2 Listar Sesiones Activas

#### `GET /api/attendance-sessions/active`

Lista sesiones no expiradas (profesores ven sus materias, estudiantes ven todas).

**Query Parameters:**
- `subject_id` (uuid, opcional) - Filtrar por materia

**Respuesta 200 (OK):**
```json
[
  {
    "id": "uuid",
    "subject_id": "uuid",
    "subject_name": "Matemáticas Discretas",
    "qr_code": "uuid-1699876543210-x7k2m9p",
    "expires_at": "2024-11-13T10:40:00Z",
    "attendance_count": 15 // Número de estudiantes que han escaneado
  }
]
```

---

### 5.3 Obtener Sesión por ID

#### `GET /api/attendance-sessions/:id`

Obtiene detalles de una sesión específica.

**Respuesta 200 (OK):**
```json
{
  "id": "uuid",
  "subject_id": "uuid",
  "subject_name": "Matemáticas Discretas",
  "qr_code": "uuid-1699876543210-x7k2m9p",
  "expires_at": "2024-11-13T10:40:00Z",
  "created_at": "2024-11-13T10:30:00Z",
  "is_expired": false,
  "attendance_records": [
    {
      "student_name": "María González",
      "scanned_at": "2024-11-13T10:35:00Z"
    }
  ]
}
```

**Errores:**
- `403` - No autorizado
- `404` - Sesión no encontrada

---

### 5.4 Terminar Sesión Manualmente

#### `DELETE /api/attendance-sessions/:id`

Termina una sesión activa antes de su expiración (solo el profesor).

**Respuesta 200 (OK):**
```json
{
  "message": "Sesión terminada exitosamente"
}
```

**Errores:**
- `403` - No es el profesor de la materia
- `404` - Sesión no encontrada

---

## 6. Endpoints de Registros de Asistencia

### 6.1 Registrar Asistencia (Escanear QR)

#### `POST /api/attendance-records`

Registra asistencia de un estudiante mediante código QR.

**Body:**
```json
{
  "qr_code": "uuid-1699876543210-x7k2m9p"
}
```

**Validaciones automáticas:**
1. Sesión existe
2. Sesión no expirada
3. Estudiante inscrito en materia
4. Sin registro duplicado

**Respuesta 201 (Created):**
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "student_id": "uuid",
  "subject_id": "uuid",
  "subject_name": "Matemáticas Discretas",
  "scanned_at": "2024-11-13T10:35:00Z"
}
```

**Errores:**
- `400` - Código QR inválido (formato)
- `401` - No autenticado
- `403` - No inscrito en la materia
- `404` - Sesión no encontrada
- `409` - Ya registró asistencia en esta sesión
- `410` - Sesión expirada

---

### 6.2 Historial de Asistencia (Estudiante)

#### `GET /api/attendance-records/me`

Obtiene historial de asistencia del estudiante autenticado.

**Query Parameters:**
- `subject_id` (uuid, opcional) - Filtrar por materia
- `start_date` (ISO date, opcional) - Desde fecha
- `end_date` (ISO date, opcional) - Hasta fecha
- `limit` (number, default 50) - Cantidad de registros
- `offset` (number, default 0) - Paginación

**Respuesta 200 (OK):**
```json
{
  "records": [
    {
      "id": "uuid",
      "subject_name": "Matemáticas Discretas",
      "subject_code": "MAT101",
      "scanned_at": "2024-11-13T10:35:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### 6.3 Reportes de Asistencia (Profesor)

#### `GET /api/attendance-records/report`

Genera reporte de asistencia para materias del profesor.

**Query Parameters:**
- `subject_id` (uuid, opcional) - Filtrar por materia (si no se especifica, todas)
- `start_date` (ISO date, requerido) - Desde fecha
- `end_date` (ISO date, requerido) - Hasta fecha
- `format` (string, default "json") - "json" o "csv"

**Respuesta 200 (OK) - JSON:**
```json
{
  "records": [
    {
      "student_name": "María González",
      "student_email": "maria@universidad.edu",
      "subject_name": "Matemáticas Discretas",
      "subject_code": "MAT101",
      "scanned_at": "2024-11-13T10:35:00Z",
      "session_id": "uuid"
    }
  ],
  "summary": {
    "total_records": 150,
    "unique_students": 25,
    "subjects": 3
  }
}
```

**Respuesta 200 (OK) - CSV:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="asistencia-2024-11-13.csv"

Estudiante,Email,Materia,Código,Fecha,Hora
María González,maria@universidad.edu,Matemáticas,MAT101,2024-11-13,10:35:00
...
```

**Errores:**
- `400` - Parámetros inválidos (fechas)
- `401` - No autenticado
- `403` - No es profesor

---

### 6.4 Obtener Registro por ID

#### `GET /api/attendance-records/:id`

Obtiene detalles de un registro específico.

**Respuesta 200 (OK):**
```json
{
  "id": "uuid",
  "student_name": "María González",
  "student_email": "maria@universidad.edu",
  "subject_name": "Matemáticas Discretas",
  "subject_code": "MAT101",
  "scanned_at": "2024-11-13T10:35:00Z",
  "session_id": "uuid"
}
```

**Errores:**
- `403` - No autorizado (solo el estudiante o profesor pueden ver)
- `404` - Registro no encontrado

---

## 7. Rate Limiting

**Límites por IP:**
- Endpoints de autenticación: 5 requests/minuto
- Otros endpoints: 60 requests/minuto

**Headers de respuesta:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699876543
```

**Respuesta 429 (Too Many Requests):**
```json
{
  "error": "Demasiadas solicitudes. Por favor intenta más tarde.",
  "retry_after": 60 // segundos
}
```

---

## 8. Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Solicitud exitosa (GET, PUT, DELETE) |
| `201` | Created | Recurso creado (POST) |
| `400` | Bad Request | Validación fallida, parámetros inválidos |
| `401` | Unauthorized | No autenticado, token inválido |
| `403` | Forbidden | Autenticado pero sin permisos |
| `404` | Not Found | Recurso no existe |
| `409` | Conflict | Conflicto (ej: duplicado) |
| `410` | Gone | Recurso expirado (sesión QR) |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Error del servidor |

---

## 9. Ejemplos de Uso

### Ejemplo 1: Flujo de Login y Crear Materia

```bash
# 1. Login
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "profesor@universidad.edu",
    "password": "SecureP@ssw0rd"
  }' \
  -c cookies.txt

# 2. Crear materia (usa cookies del login)
curl -X POST https://api.example.com/api/subjects \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Matemáticas Discretas",
    "code": "MAT101",
    "schedule": "Lunes 10:00-12:00"
  }'
```

### Ejemplo 2: Generar QR y Escanear

```javascript
// Cliente: Generar QR (profesor)
async function generateQR(subjectId) {
  const response = await fetch('/api/attendance-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject_id: subjectId,
      expires_in_minutes: 10
    })
  })

  const data = await response.json()
  console.log('QR Image:', data.qr_image)
  return data.session
}

// Cliente: Escanear QR (estudiante)
async function scanQR(qrCode) {
  const response = await fetch('/api/attendance-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qr_code: qrCode })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  return await response.json()
}
```

---

## Conclusión

La API del Sistema de Asistencia Estudiantil proporciona endpoints completos y bien documentados para todas las operaciones del sistema:

- **RESTful:** Sigue principios REST estándar
- **Segura:** Autenticación en cada request, RLS en DB
- **Validada:** Validación exhaustiva de inputs
- **Documentada:** Respuestas claras y códigos de estado apropiados
- **Escalable:** Rate limiting y optimizaciones

Esta API puede ser consumida por:
- La aplicación web Next.js (actual)
- Aplicaciones móviles nativas (futuro)
- Integraciones de terceros (con API key)

---

[← Implementación QR](07-QR_IMPLEMENTACION.md) | [Volver al Índice](README.md) | [Siguiente: Guía de Desarrollo →](09-GUIA_DESARROLLO.md)
