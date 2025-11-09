-- ============================================================================
-- SCRIPT PARA APLICAR TODAS LAS MIGRACIONES PENDIENTES
-- Ejecuta este script en el SQL Editor de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/elthoicbggstbrjsxuog/sql
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR QUE EL TRIGGER DE PERFILES EXISTE
-- ============================================================================
-- Este trigger crea automáticamente un perfil cuando un usuario se registra

-- Si el trigger ya existe, esto no hará nada
-- Si no existe, lo creará
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuario'),
    COALESCE(new.raw_user_meta_data ->> 'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. ACTUALIZAR POLÍTICA RLS PARA SESIONES DE ASISTENCIA
-- ============================================================================
-- Permite mejores mensajes de error al escanear QR

DROP POLICY IF EXISTS "students_view_active_sessions" ON public.attendance_sessions;

CREATE POLICY "students_view_active_sessions"
  ON public.attendance_sessions FOR SELECT
  USING (expires_at > now());

-- ============================================================================
-- 3. HABILITAR AUTO-INSCRIPCIÓN DE ESTUDIANTES
-- ============================================================================
-- Permite que los estudiantes vean todas las materias y se inscriban

-- Permitir que estudiantes vean todas las materias
DROP POLICY IF EXISTS "students_view_all_subjects" ON public.subjects;

CREATE POLICY "students_view_all_subjects"
  ON public.subjects FOR SELECT
  USING (true);

-- Permitir que estudiantes se auto-inscriban
DROP POLICY IF EXISTS "students_insert_own_enrollments" ON public.enrollments;

CREATE POLICY "students_insert_own_enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- ============================================================================
-- 4. VERIFICAR CONFIGURACIÓN
-- ============================================================================
-- Ejecuta estas queries para verificar que todo está correcto:

-- Ver triggers existentes
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'users'
  OR trigger_name = 'on_auth_user_created';

-- Ver políticas RLS de subjects
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'subjects';

-- Ver políticas RLS de enrollments
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'enrollments';

-- Ver políticas RLS de attendance_sessions
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'attendance_sessions';

-- ============================================================================
-- ✅ COMPLETADO
-- ============================================================================
-- Si todas las queries se ejecutaron sin errores:
-- 1. ✅ El trigger de perfiles está activo
-- 2. ✅ Los estudiantes pueden ver todas las materias
-- 3. ✅ Los estudiantes pueden auto-inscribirse
-- 4. ✅ Los mensajes de error de QR son más específicos
-- ============================================================================
