# Guía de Desarrollo

## 1. Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Versión Recomendada | Propósito |
|----------|----------------|---------------------|-----------|
| Node.js | 18.17+ | 20.x LTS | Runtime de JavaScript |
| npm | 9.0+ | 10.x | Gestor de paquetes |
| Git | 2.30+ | Latest | Control de versiones |
| VSCode | 1.80+ | Latest | Editor recomendado |

### Cuentas Necesarias

1. **Cuenta Supabase:**
   - Registro gratuito en https://supabase.com
   - Crear proyecto (free tier suficiente)

2. **Cuenta GitHub:**
   - Para clonar repositorio
   - Para contribuir con cambios

3. **Cuenta Vercel (Opcional):**
   - Para despliegue en producción
   - Integración automática con GitHub

---

## 2. Configuración del Entorno Local

### Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/student-attendance-app.git

# Navegar al directorio
cd student-attendance-app

# Verificar rama actual
git branch
# * main
```

---

### Paso 2: Instalar Dependencias

```bash
# Instalar todas las dependencias del proyecto
npm install

# Esto instalará:
# - Next.js 16
# - React 19
# - TypeScript
# - Tailwind CSS
# - Supabase clients
# - Y todas las demás dependencias
```

**Tiempo estimado:** 2-3 minutos

**Verificación:**
```bash
# Verificar que node_modules existe
ls -la node_modules

# Verificar versiones instaladas
npm list next react typescript
```

---

### Paso 3: Configurar Variables de Entorno

#### Crear archivo `.env.local`

```bash
# Crear archivo de variables de entorno
cp .env.example .env.local  # Si existe .env.example
# O crear manualmente:
touch .env.local
```

#### Contenido de `.env.local`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://elthoicbggstbrjsxuog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Opcional: Para conexión directa a DB (solo desarrollo)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

#### Obtener Credenciales de Supabase

1. Ir a https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Settings** → **API**
4. Copiar:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ IMPORTANTE:**
- Nunca commitear `.env.local` a Git
- `.env.local` está en `.gitignore` por defecto
- El `ANON_KEY` es seguro para el cliente (protegido por RLS)
- NUNCA exponer el `SERVICE_ROLE_KEY` en cliente

---

### Paso 4: Configurar Base de Datos

#### Aplicar Migraciones

1. Ir al Dashboard de Supabase: https://supabase.com/dashboard/project/elthoicbggstbrjsxuog/sql

2. Copiar contenido de `supabase/APPLY_ALL_MIGRATIONS.sql`

3. Pegar en el SQL Editor y ejecutar

**Migraciones incluidas:**
- Creación de tablas
- Políticas RLS
- Triggers
- Índices
- Funciones

**Verificación:**
```sql
-- Verificar que las tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deberías ver:
-- attendance_records
-- attendance_sessions
-- enrollments
-- profiles
-- subjects
```

---

### Paso 5: Iniciar Servidor de Desarrollo

```bash
# Iniciar Next.js en modo desarrollo
npm run dev

# Output esperado:
# ▲ Next.js 16.0.0
# - Local:        http://localhost:3000
# - ready started server on 0.0.0.0:3000
```

**Abrir en navegador:**
```
http://localhost:3000
```

**Deberías ver:**
- Landing page del sistema
- Botones "Iniciar Sesión" y "Registrarse"

---

## 3. Estructura del Proyecto

```
student-attendance-app/
├── app/                          # Next.js App Router
│   ├── auth/                     # Páginas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── teacher/                  # Dashboard de profesores
│   │   ├── layout.tsx           # Layout con guard
│   │   ├── page.tsx             # Dashboard principal
│   │   ├── qr/                  # Generación de QR
│   │   └── reports/             # Reportes
│   ├── student/                  # Dashboard de estudiantes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── subjects/            # Explorar materias
│   │   └── history/             # Historial
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── subjects/
│   │   ├── enrollments/
│   │   ├── attendance-sessions/
│   │   └── attendance-records/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Estilos globales
│
├── components/                   # Componentes React
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── qr-generator-card.tsx
│   ├── qr-scanner-dialog.tsx
│   └── ...
│
├── lib/                          # Librerías y utilidades
│   ├── supabase/                # Clientes Supabase
│   │   ├── client.ts           # Cliente browser
│   │   ├── server.ts           # Cliente server
│   │   └── middleware.ts       # Middleware de sesión
│   ├── qr/                      # Utilidades QR
│   │   ├── generator.ts
│   │   └── scanner.ts
│   ├── types.ts                 # Definiciones TypeScript
│   └── utils.ts                 # Funciones auxiliares
│
├── supabase/                     # Archivos de Supabase
│   ├── migrations/              # Migraciones SQL
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_create_profile_trigger.sql
│   │   └── ...
│   └── APPLY_ALL_MIGRATIONS.sql
│
├── public/                       # Assets estáticos
│   ├── favicon.ico
│   └── images/
│
├── .env.local                    # Variables de entorno (NO en Git)
├── .env.example                  # Ejemplo de variables
├── .gitignore                    # Archivos ignorados por Git
├── next.config.js                # Configuración Next.js
├── tailwind.config.ts            # Configuración Tailwind
├── tsconfig.json                 # Configuración TypeScript
├── package.json                  # Dependencias
├── package-lock.json             # Lock de dependencias
├── CLAUDE.md                     # Documentación para Claude Code
└── README.md                     # README del proyecto
```

---

## 4. Scripts Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo (hot reload)
npm run dev

# Servidor en http://localhost:3000
# Cambios se reflejan automáticamente
```

### Build

```bash
# Crear build de producción
npm run build

# Output en carpeta .next/
# Verifica errores de TypeScript y ESLint
```

### Producción Local

```bash
# Primero hacer build
npm run build

# Luego iniciar servidor de producción
npm start

# Servidor en http://localhost:3000
```

### Linting

```bash
# Ejecutar ESLint
npm run lint

# Verifica:
# - Errores de sintaxis
# - Mejores prácticas
# - Reglas de Next.js
```

### Type Checking

```bash
# Verificar tipos de TypeScript sin compilar
npx tsc --noEmit

# Útil para encontrar errores de tipos
# No genera archivos de salida
```

---

## 5. Workflow de Desarrollo

### Crear Nueva Feature

1. **Crear rama desde main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nombre-feature
   ```

2. **Desarrollar feature:**
   - Escribir código
   - Probar localmente con `npm run dev`
   - Verificar tipos con `npx tsc --noEmit`

3. **Commit cambios:**
   ```bash
   git add .
   git commit -m "feat: descripción de la feature"
   ```

4. **Push a GitHub:**
   ```bash
   git push origin feature/nombre-feature
   ```

5. **Crear Pull Request:**
   - Ir a GitHub
   - Crear PR de `feature/nombre-feature` a `main`
   - Esperar revisión

### Convenciones de Commits

Seguir **Conventional Commits:**

```bash
# Features
git commit -m "feat: agregar scanner de QR"
git commit -m "feat(student): agregar historial de asistencia"

# Fixes
git commit -m "fix: corregir cleanup de cámara"
git commit -m "fix(auth): resolver loop de redirección"

# Documentación
git commit -m "docs: actualizar README"

# Refactoring
git commit -m "refactor: extraer lógica de QR a servicio"

# Estilos
git commit -m "style: formatear código con prettier"

# Tests
git commit -m "test: agregar tests para QRService"

# Chores
git commit -m "chore: actualizar dependencias"
```

---

## 6. Debugging

### Debugging en VSCode

**Configuración `.vscode/launch.json`:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

**Uso:**
1. Poner breakpoints en código
2. F5 para iniciar debugging
3. Navegar en el navegador

### Logging

```typescript
// Development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}

// Production - usar con moderación
console.error('Critical error:', error)
```

### React DevTools

```bash
# Instalar extensión en Chrome/Firefox
# https://react.dev/learn/react-developer-tools

# Permite inspeccionar:
# - Component tree
# - Props y state
# - Hooks
# - Profiler para performance
```

### Supabase Dashboard

**Debugging de queries:**
1. Ir a Dashboard → SQL Editor
2. Ejecutar queries manualmente
3. Ver logs en Table Editor

**Ver logs de autenticación:**
1. Dashboard → Authentication → Logs
2. Ver intentos de login, registros, etc.

---

## 7. Testing

### Testing Manual

**Checklist antes de commit:**

- [ ] Funcionalidad probada en navegador
- [ ] Probado en desktop y mobile (responsive)
- [ ] Sin errores en consola
- [ ] TypeScript sin errores (`npx tsc --noEmit`)
- [ ] ESLint sin errores (`npm run lint`)
- [ ] Build exitoso (`npm run build`)

### Testing con Playwright (E2E)

```bash
# Instalar Playwright
npm install -D @playwright/test

# Ejecutar tests
npx playwright test

# Ejecutar en modo UI (interactivo)
npx playwright test --ui

# Ejecutar en modo debug
npx playwright test --debug
```

**Ejemplo de test:**

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/login')

  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')

  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/\/(teacher|student)/)
})
```

---

## 8. Solución de Problemas Comunes

### Problema: npm install falla

**Solución:**
```bash
# Limpiar cache
npm cache clean --force

# Eliminar node_modules y lock file
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

### Problema: Puerto 3000 en uso

**Solución:**
```bash
# Encontrar proceso usando puerto 3000
lsof -i :3000

# Matar proceso
kill -9 PID

# O usar puerto alternativo
PORT=3001 npm run dev
```

### Problema: Errores de TypeScript

**Solución:**
```bash
# Verificar tipos
npx tsc --noEmit

# Ver errores específicos
# Corregir uno por uno

# Restart de TypeScript server en VSCode
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Problema: "Supabase: Session not found"

**Causa:** Cookies no válidas

**Solución:**
1. Borrar cookies del navegador
2. Logout y login nuevamente
3. Verificar `.env.local` tiene URLs correctas

### Problema: RLS Policy blocks query

**Causa:** Políticas RLS muy restrictivas

**Solución:**
1. Verificar que el usuario está autenticado
2. Verificar rol del usuario en DB
3. Revisar políticas RLS en Supabase Dashboard
4. Temporalmente desactivar RLS para debug:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   -- DEBUG ONLY, NO EN PRODUCCION
   ```

### Problema: Cámara no funciona

**Causa:** Permisos o HTTPS

**Solución:**
- Localhost es considerado seguro (funciona con HTTP)
- En producción requiere HTTPS (Vercel lo provee automáticamente)
- Verificar permisos del navegador

---

## 9. Hot Reloading y Fast Refresh

Next.js incluye **Fast Refresh** que preserva el estado de React:

**Funciona automáticamente para:**
- Componentes React
- Estilos CSS
- Server Components

**Requiere reload manual para:**
- Cambios en `.env.local`
- Cambios en `next.config.js`
- Cambios en `middleware.ts`
- Adición de archivos en `app/api`

**Forzar reload:**
```bash
# Detener servidor: Ctrl+C
# Reiniciar:
npm run dev
```

---

## 10. Extensiones Recomendadas de VSCode

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",           // ESLint
    "esbenp.prettier-vscode",           // Prettier
    "bradlc.vscode-tailwindcss",        // Tailwind IntelliSense
    "ms-vscode.vscode-typescript-next", // TypeScript
    "supabase.supabase-vscode",         // Supabase snippets
    "formulahendry.auto-rename-tag",    // Auto rename HTML tags
    "christian-kohler.path-intellisense" // Path autocomplete
  ]
}
```

---

## 11. Configuración de Prettier (Opcional)

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

```bash
# Formatear código
npx prettier --write .
```

---

## 12. Tips de Productividad

### Shortcuts de VSCode

- `Cmd+P` (Mac) / `Ctrl+P` (Win) - Quick file open
- `Cmd+Shift+P` - Command palette
- `F12` - Go to definition
- `Shift+F12` - Find references
- `Cmd+D` - Select next occurrence
- `Cmd+/` - Toggle comment

### TypeScript IntelliSense

- Hover sobre variables para ver tipos
- `Cmd+.` para quick fixes
- Auto-import de módulos

### Tailwind IntelliSense

- Autocomplete de clases Tailwind
- Preview de colores
- Hover para ver CSS generado

---

## 13. Recursos Adicionales

### Documentación Oficial

- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Supabase:** https://supabase.com/docs
- **shadcn/ui:** https://ui.shadcn.com

### Comunidad y Soporte

- **Next.js Discord:** https://nextjs.org/discord
- **Supabase Discord:** https://discord.supabase.com
- **Stack Overflow:** Tag `next.js`, `supabase`

---

## Conclusión

Con esta guía deberías poder:

1. ✅ Configurar entorno de desarrollo local
2. ✅ Entender estructura del proyecto
3. ✅ Ejecutar y debuggear la aplicación
4. ✅ Contribuir con nuevo código
5. ✅ Resolver problemas comunes

**Próximos pasos:**
- Explorar el código base
- Hacer pequeños cambios para familiarizarte
- Leer documentación de tecnologías clave
- Contribuir con nuevas features

---

[← API Endpoints](08-API_ENDPOINTS.md) | [Volver al Índice](README.md) | [Siguiente: Deployment →](10-DEPLOYMENT.md)
