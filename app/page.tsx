import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, QrCode, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <GraduationCap className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Sistema de Asistencia QR</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Registra y gestiona la asistencia de estudiantes de forma rápida y segura usando códigos QR
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <QrCode className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Códigos QR</CardTitle>
              <CardDescription>Genera códigos QR únicos para cada clase con expiración automática</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Registro Rápido</CardTitle>
              <CardDescription>
                Los estudiantes escanean el código para registrar su asistencia al instante
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <GraduationCap className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Reportes Completos</CardTitle>
              <CardDescription>Consulta y exporta reportes de asistencia por materia y fecha</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl">Soy Profesor</CardTitle>
              <CardDescription>Gestiona tus materias, genera códigos QR y consulta la asistencia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Crear y administrar materias
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Generar códigos QR para clases
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Ver reportes de asistencia
                </li>
              </ul>
              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/auth/login?role=teacher">Iniciar Sesión</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href="/auth/register?role=teacher">Registrarse</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="text-2xl">Soy Estudiante</CardTitle>
              <CardDescription>Escanea códigos QR y registra tu asistencia en segundos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Escanear códigos QR
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Registrar asistencia rápidamente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Ver tu historial de asistencia
                </li>
              </ul>
              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href="/auth/login?role=student">Iniciar Sesión</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href="/auth/register?role=student">Registrarse</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
