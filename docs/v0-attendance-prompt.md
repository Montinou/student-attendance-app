# Prompt para v0: Sistema de Asistencia con QR

## Contexto
Necesito crear una aplicación web de asistencia estudiantil basada en códigos QR. La arquitectura debe seguir MVC (Model-View-Controller) con Next.js como framework y Supabase como base de datos y autenticación.

## Stack Técnico Requerido
- Next.js 14+ con App Router
- React Server Components
- Tailwind CSS
- shadcn/ui components
- TypeScript strict mode
- Supabase para Auth y Database

## Estructura de Componentes

### 1. Landing Page / Login
Crea una página de autenticación que incluya:
- Logo del sistema en la parte superior
- Dos tabs: "Docente" e "Estudiante"
- Campos de email y contraseña
- Botón "Iniciar Sesión" y enlace "Crear Cuenta"
- Estilo moderno con gradiente de fondo sutil
- Responsive design para mobile

### 2. Dashboard Docente
Crea un dashboard con:
- Header con nombre del docente, botón de logout
- Sidebar con navegación: "Materias", "Generar QR", "Asistencias", "Reportes"
- Tarjeta principal mostrando la materia actual seleccionada
- Botón prominente "Generar QR para Esta Clase"
- Tabla de estudiantes con columnas: Nombre, Email, Asistencia (sí/no)
- Filtro por materia
- Exportar datos a CSV

### 3. Dashboard Estudiante
Crea un dashboard con:
- Header con nombre del estudiante
- Sección "Mis Clases"
- Tarjetas de materias con horarios
- Botón "Escanear QR" prominente
- Historial de asistencias con fechas

### 4. Gestión de Materias (Docente)
Crear/Editar Materia:
- Nombre de la materia
- Código de materia
- Horario
- Descripción
- Guardar cambios

### 5. Gestión de Estudiantes (Admin)
- Tabla de estudiantes registrados
- Opciones para editar, eliminar
- Filtro por materia
- Búsqueda por nombre/email

### 6. QR Scanner Modal
Crea un modal para escanear QR que incluya:
- Video preview de la cámara
- Indicador visual cuando se detecta QR
- Confirmación de lectura exitosa
- Botón cerrar

## Especificaciones de Diseño
- Paleta de colores: Azul profesional (#3b82f6), blanco, grises neutros
- Tipografía: Inter font desde Google Fonts
- Espaciado consistente usando escala de Tailwind
- Todos los botones con estados hover y focus
- Animaciones suaves en transiciones
- Accesibilidad: aria-labels, semantic HTML, focus visible

## Integraciones Requeridas
- Conectar formularios a Supabase Auth
- Crear/Leer datos de Supabase en tiempo real
- Manejo de sesiones con cookies
- Protección de rutas autenticadas

## Notas Importantes
- Usa componentes reutilizables
- Implementa loading states
- Manejo de errores con toasts/alerts
- Variables de entorno para Supabase
- Usa TypeScript para type safety