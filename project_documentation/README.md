# Documentación Técnica - Sistema de Asistencia Estudiantil

## Índice General

Esta documentación proporciona una descripción completa y detallada del Sistema de Asistencia Estudiantil desarrollado con Next.js, React, TypeScript y Supabase.

### Documentos Disponibles

1. **[Resumen Ejecutivo](01-RESUMEN_EJECUTIVO.md)**
   - Descripción general del proyecto
   - Objetivos y alcance
   - Tecnologías principales utilizadas
   - Casos de uso del sistema

2. **[Arquitectura del Sistema](02-ARQUITECTURA_SISTEMA.md)**
   - Arquitectura general (Frontend + Backend + Base de datos)
   - Diagramas de arquitectura
   - Patrones de diseño implementados
   - Flujo de datos en la aplicación

3. **[Stack Tecnológico](03-TECNOLOGIAS_STACK.md)**
   - Detalle completo de todas las tecnologías
   - Justificación de cada elección tecnológica
   - Versiones y compatibilidad
   - Dependencias y librerías utilizadas

4. **[Base de Datos](04-BASE_DE_DATOS.md)**
   - Esquema completo de la base de datos
   - Diagrama Entidad-Relación
   - Descripción de tablas y campos
   - Políticas de seguridad (Row Level Security)
   - Triggers y funciones

5. **[Autenticación y Seguridad](05-AUTENTICACION_SEGURIDAD.md)**
   - Sistema de autenticación con Supabase
   - Manejo de sesiones basado en cookies
   - Control de acceso basado en roles
   - Políticas de seguridad implementadas
   - Mejores prácticas de seguridad

6. **[Funcionalidades del Sistema](06-FUNCIONALIDADES.md)**
   - Funcionalidades para profesores
   - Funcionalidades para estudiantes
   - Flujos de usuario detallados
   - Capturas y descripciones de interfaces

7. **[Implementación de Códigos QR](07-QR_IMPLEMENTACION.md)**
   - Generación de códigos QR (lado del servidor)
   - Escaneo de códigos QR (lado del cliente)
   - Formato y validación de códigos
   - Manejo de expiración y sesiones
   - Flujo completo de registro de asistencia

8. **[Documentación de API](08-API_ENDPOINTS.md)**
   - Documentación de todos los endpoints
   - Métodos HTTP, rutas y parámetros
   - Schemas de request y response
   - Códigos de error y validaciones

9. **[Guía de Desarrollo](09-GUIA_DESARROLLO.md)**
   - Configuración del entorno local
   - Variables de entorno requeridas
   - Comandos disponibles
   - Proceso de desarrollo
   - Aplicación de migraciones de base de datos

10. **[Despliegue](10-DEPLOYMENT.md)**
    - Proceso de despliegue en Vercel
    - Configuración de producción
    - URLs y accesos al sistema
    - Monitoreo y logs

11. **[Patrones y Mejores Prácticas](11-PATRONES_MEJORES_PRACTICAS.md)**
    - Patrones de código implementados
    - Mejores prácticas de React y Next.js
    - Manejo correcto de Supabase
    - Cleanup de efectos y suscripciones

---

## Acerca del Proyecto

**Sistema de Asistencia Estudiantil** es una aplicación web moderna que permite a profesores y estudiantes gestionar la asistencia a clases mediante códigos QR. El sistema está construido con las últimas tecnologías web y sigue las mejores prácticas de desarrollo.

### Características Principales

- Generación de códigos QR con tiempo de expiración
- Escaneo de QR mediante cámara del dispositivo
- Gestión de materias y estudiantes
- Reportes y exportación de datos
- Sistema de autenticación robusto
- Control de acceso basado en roles

### Tecnologías Destacadas

- **Next.js 16** - Framework de React con App Router
- **React 19** - Biblioteca de UI con Server Components
- **TypeScript** - Tipado estático
- **Supabase** - Backend como servicio (PostgreSQL + Auth)
- **Tailwind CSS v4** - Framework de estilos
- **shadcn/ui** - Componentes de UI
- **QR Code** - Generación y escaneo de códigos QR

### URLs del Proyecto

- **Producción:** https://v0-student-attendance-app-fawn.vercel.app
- **Dashboard Supabase:** https://supabase.com/dashboard/project/elthoicbggstbrjsxuog
- **Dashboard Vercel:** https://vercel.com/agustin-montoyas-projects-554f9f37/v0-student-attendance-app

---

## Cómo Usar Esta Documentación

1. Si eres nuevo en el proyecto, comienza con el **Resumen Ejecutivo**
2. Para entender la arquitectura, revisa **Arquitectura del Sistema**
3. Para configurar tu entorno de desarrollo, ve a **Guía de Desarrollo**
4. Para detalles técnicos específicos, consulta las secciones correspondientes

---

## Contacto y Soporte

Este proyecto fue desarrollado como parte de un trabajo universitario para demostrar el uso de tecnologías web modernas en la solución de problemas reales de gestión educativa.

**Última actualización:** Noviembre 2025
