<?xml version="1.0" encoding="UTF-8"?>
<claude-code-instructions>
  <project-name>QR Attendance System - QR Integration Module</project-name>
  <version>1.0</version>
  <last-updated>2025-11-08</last-updated>
  
  <overview>
    <description>
      Instrucciones detalladas para integrar el sistema de generación de códigos QR y escaneo con cámara en la aplicación de asistencia. Este módulo maneja la lógica completa: creación de QR, visualización, escaneo mediante cámara web y guardado en base de datos Supabase.
    </description>
    <scope>
      - Generación de códigos QR únicos por sesión
      - Escaneo de QR mediante cámara web/móvil
      - Validación y procesamiento de datos QR
      - Integración con Supabase para persistencia
      - Manejo de errores y casos edge
    </scope>
  </overview>

  <dependencies>
    <required>
      <package name="qrcode" version="^1.5.3">
        <purpose>Generar códigos QR en formato imagen/SVG</purpose>
        <install>npm install qrcode</install>
      </package>
      <package name="html5-qrcode" version="^2.3.8">
        <purpose>Escanear QR con cámara web - librería multiplataforma</purpose>
        <install>npm install html5-qrcode</install>
      </package>
      <package name="@supabase/supabase-js" version="^2.38.0">
        <purpose>Cliente Supabase para guardar datos</purpose>
      </package>
      <package name="zod" version="^3.22.0">
        <purpose>Validación de datos de QR escaneados</purpose>
      </package>
    </required>
  </dependencies>

  <file-structure>
    <directory path="/src/lib/qr/">
      <description>Lógica de QR - generación y validación</description>
      <files>
        <file name="qrGenerator.ts">
          Funciones para generar códigos QR únicos
          - generateQRCode(sessionId: string): Promise&lt;string&gt;
          - generateSessionQRData(subjectId, teacherId, timestamp): string
        </file>
        <file name="qrValidator.ts">
          Validación de códigos QR escaneados
          - validateQRData(scannedText: string): ValidationResult
          - isSessionActive(sessionId: string): Promise&lt;boolean&gt;
          - hasAlreadyAttended(sessionId: string, studentId: string): Promise&lt;boolean&gt;
        </file>
        <file name="qrTypes.ts">
          Tipos TypeScript y schemas Zod
          - type QRSessionData
          - schema: QRDataSchema
        </file>
      </files>
    </directory>
    
    <directory path="/src/components/features/">
      <description>Componentes React para UI de QR</description>
      <files>
        <file name="QRGenerator.tsx">
          Componente para generar y mostrar QR
          - Props: subjectId, teacherId, sessionId
          - Muestra código QR en pantalla
          - Botón para descargar/imprimir
        </file>
        <file name="QRScanner.tsx">
          Componente modal para escanear QR con cámara
          - Props: onScanSuccess, onScanError, onClose
          - Usa html5-qrcode para acceder a cámara
          - Maneja permisos de cámara
          - Loading state mientras se busca dispositivo
        </file>
        <file name="ScanSuccessModal.tsx">
          Modal de confirmación cuando se escanea exitosamente
          - Muestra nombre del estudiante
          - Confirma asistencia registrada
          - Opción para otro escaneo o cerrar
        </file>
      </files>
    </directory>

    <directory path="/src/app/api/">
      <description>API Routes para operaciones de QR</description>
      <files>
        <file name="attendance-sessions/route.ts">
          POST: Crear sesión de asistencia y generar QR
          GET: Listar sesiones activas de un docente
          PATCH: Actualizar estado de sesión (cerrar)
        </file>
        <file name="attendance-records/route.ts">
          POST: Registrar asistencia al escanear QR
          Validaciones: sesión activa, estudiante inscrito, no duplicado
          GET: Historial de asistencias de estudiante
        </file>
        <file name="qr-verification/route.ts">
          POST: Verificar que un QR es válido antes de registrar
          Retorna: sessionId, subjectId, timeRemaining
        </file>
      </files>
    </directory>

    <directory path="/src/actions/">
      <description>Server Actions para operaciones sensibles</description>
      <files>
        <file name="qrActions.ts">
          'use server' functions
          - recordAttendanceFromQR(sessionId, userId): Promise&lt;{success, message}&gt;
          - createAttendanceSession(subjectId): Promise&lt;{qrCode, sessionId}&gt;
        </file>
      </files>
    </directory>
  </file-structure>

  <implementation-guide>
    
    <section name="1. Generación de QR">
      <step number="1">
        <title>Crear archivo qrGenerator.ts</title>
        <code language="typescript">
// /src/lib/qr/qrGenerator.ts
import QRCode from 'qrcode';

export interface QRSessionPayload {
  sessionId: string;
  subjectId: string;
  teacherId: string;
  timestamp: number;
}

// Generar datos QR - incluir info verificable
export function generateSessionQRData(
  sessionId: string,
  subjectId: string,
  teacherId: string
): string {
  const payload: QRSessionPayload = {
    sessionId,
    subjectId,
    teacherId,
    timestamp: Date.now(),
  };
  
  // Encoding: sessionId|subjectId|teacherId|timestamp
  // Ejemplo: "SESS_abc123|SUBJ_xyz789|TEACH_def456|1699460640000"
  return `${payload.sessionId}|${payload.subjectId}|${payload.teacherId}|${payload.timestamp}`;
}

// Generar imagen QR
export async function generateQRImage(
  data: string,
  options: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  } = {}
): Promise&lt;string&gt; {
  try {
    const qrImage = await QRCode.toDataURL(data, {
      width: options.width || 300,
      margin: options.margin || 2,
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      type: 'image/png',
      quality: 0.95,
    });
    return qrImage; // Retorna base64
  } catch (error) {
    console.error('Error generating QR:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Generar SVG QR (opcional, para mejor calidad en impresiones)
export async function generateQRSVG(data: string): Promise&lt;string&gt; {
  try {
    const qrSvg = await QRCode.toString(data, {
      type: 'svg',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    return qrSvg;
  } catch (error) {
    console.error('Error generating QR SVG:', error);
    throw new Error('Failed to generate QR SVG');
  }
}
        </code>
      </step>

      <step number="2">
        <title>Crear tipos y validación (qrTypes.ts)</title>
        <code language="typescript">
// /src/lib/qr/qrTypes.ts
import { z } from 'zod';

export const QRDataSchema = z.object({
  sessionId: z.string().startsWith('SESS_'),
  subjectId: z.string().startsWith('SUBJ_'),
  teacherId: z.string().uuid(),
  timestamp: z.number(),
});

export type QRData = z.infer&lt;typeof QRDataSchema&gt;;

export interface AttendanceSessionRecord {
  id: string;
  subject_id: string;
  teacher_id: string;
  qr_code: string;
  status: 'active' | 'closed';
  created_at: string;
  expires_at: string; // 30 minutos después de creación
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  checked_in_at: string;
  ip_address: string;
}
        </code>
      </step>

      <step number="3">
        <title>Crear API Route para generar sesión de asistencia</title>
        <code language="typescript">
// /src/app/api/attendance-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';
import { generateSessionQRData, generateQRImage } from '@/lib/qr/qrGenerator';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar usuario (debe ser docente)
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Validar que es docente
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create sessions' },
        { status: 403 }
      );
    }

    // 3. Obtener datos del request
    const { subject_id } = await request.json();

    if (!subject_id) {
      return NextResponse.json(
        { error: 'subject_id required' },
        { status: 400 }
      );
    }

    // 4. Verificar que la materia pertenece al docente
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subject_id)
      .eq('teacher_id', user.id)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Subject not found or unauthorized' },
        { status: 404 }
      );
    }

    // 5. Generar IDs únicos
    const sessionId = `SESS_${uuidv4().slice(0, 8)}`;
    const subjectPrefix = `SUBJ_${uuidv4().slice(0, 8)}`;

    // 6. Generar datos QR
    const qrData = generateSessionQRData(sessionId, subject_id, user.id);
    const qrImage = await generateQRImage(qrData);

    // 7. Insertar sesión en BD
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    
    const { data: session, error: insertError } = await supabase
      .from('attendance_sessions')
      .insert({
        id: sessionId,
        subject_id,
        teacher_id: user.id,
        qr_code: qrData,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    // 8. Retornar respuesta
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        subject_id: session.subject_id,
        qr_code: qrData,
        qr_image: qrImage,
        expires_at: expiresAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error in POST /api/attendance-sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
        </code>
      </step>
    </section>

    <section name="2. Escaneo de QR">
      <step number="4">
        <title>Crear componente QRScanner.tsx</title>
        <code language="typescript">
// /src/components/features/QRScanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Html5QrcodeScanner from 'html5-qrcode/esm/html5-qrcode-scanner.js';
import Html5QrcodeSupportedFormats from 'html5-qrcode/esm/core.js';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (scannedData: string) => Promise&lt;void&gt;;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

export default function QRScanner({
  onScanSuccess,
  onScanError,
  onClose,
}: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState&lt;string | null&gt;(null);
  const scannerRef = useRef&lt;Html5QrcodeScanner | null&gt;(null);

  useEffect(() => {
    initializeScanner();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          console.error('Error clearing scanner:', err);
        }
      }
    };
  }, []);

  const initializeScanner = async () => {
    try {
      setLoading(true);
      
      // Configurar el escáner HTML5
      const scanner = new Html5QrcodeScanner(
        'qr-reader', // ID del div donde se renderiza
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          facingMode: 'environment', // Usar cámara trasera en móvil
          rememberLastUsedCamera: true,
          supportedScanTypes: [
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        },
        false
      );

      // Callback exitoso
      const onScanSuccessCallback = async (decodedText: string) => {
        setScanning(true);
        try {
          await onScanSuccess(decodedText);
          // Pausar escáner después de éxito
          scanner.pause();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error processing scan';
          setError(errorMessage);
          onScanError?.(errorMessage);
        } finally {
          setScanning(false);
        }
      };

      // Callback error (no lo lanzamos, solo ignoramos para flujo continuo)
      const onScanFailureCallback = (error: string) => {
        // Ignorar errores durante escaneo continuo
        console.debug('Scan attempt:', error);
      };

      scanner.render(onScanSuccessCallback, onScanFailureCallback);
      scannerRef.current = scanner;
      setLoading(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize camera';
      setError(errorMessage);
      onScanError?.(errorMessage);
      setLoading(false);
    }
  };

  const handleResume = () => {
    if (scannerRef.current) {
      scannerRef.current.resume();
      setError(null);
    }
  };

  return (
    &lt;div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"&gt;
      &lt;div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"&gt;
        &lt;h2 className="text-xl font-bold mb-4"&gt;Escanea tu QR de Asistencia&lt;/h2&gt;

        {loading && (
          &lt;div className="flex flex-col items-center justify-center py-16 space-y-4"&gt;
            &lt;Loader2 className="w-8 h-8 animate-spin text-blue-600" /&gt;
            &lt;p className="text-sm text-gray-600"&gt;Inicializando cámara...&lt;/p&gt;
          &lt;/div&gt;
        )}

        {error && (
          &lt;div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex gap-3"&gt;
            &lt;AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /&gt;
            &lt;div&gt;
              &lt;p className="text-sm font-medium text-red-900"&gt;Error&lt;/p&gt;
              &lt;p className="text-sm text-red-700"&gt;{error}&lt;/p&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        )}

        {!loading && (
          &lt;&gt;
            &lt;div 
              id="qr-reader" 
              className="mb-4 rounded-lg overflow-hidden border-2 border-blue-300 bg-gray-100"
              style={{ minHeight: '350px' }}
            &gt;&lt;/div&gt;

            {scanning && (
              &lt;div className="flex items-center gap-2 text-sm text-blue-600 mb-4"&gt;
                &lt;Loader2 className="w-4 h-4 animate-spin" /&gt;
                Procesando...
              &lt;/div&gt;
            )}
          &lt;/&gt;
        )}

        &lt;div className="flex gap-3"&gt;
          {error && (
            &lt;Button
              onClick={handleResume}
              variant="outline"
              className="flex-1"
              disabled={scanning}
            &gt;
              Reintentar
            &lt;/Button&gt;
          )}
          &lt;Button
            onClick={onClose}
            variant="destructive"
            className="flex-1"
            disabled={scanning}
          &gt;
            Cerrar
          &lt;/Button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
        </code>
      </step>

      <step number="5">
        <title>Crear API Route para registrar asistencia</title>
        <code language="typescript">
// /src/app/api/attendance-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';
import { QRDataSchema } from '@/lib/qr/qrTypes';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar estudiante
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obtener QR escaneado
    const { qr_data } = await request.json();

    if (!qr_data) {
      return NextResponse.json(
        { error: 'qr_data required' },
        { status: 400 }
      );
    }

    // 3. Parsear y validar QR
    const [sessionId, subjectId, teacherId, timestamp] = qr_data.split('|');

    const validationResult = QRDataSchema.safeParse({
      sessionId,
      subjectId,
      teacherId,
      timestamp: parseInt(timestamp),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid QR format' },
        { status: 400 }
      );
    }

    const qrData = validationResult.data;

    // 4. Verificar que la sesión existe y está activa
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // 5. Validar que no ha pasado tiempo de expiración
    const expiryTime = new Date(session.expires_at).getTime();
    if (Date.now() > expiryTime) {
      return NextResponse.json(
        { error: 'QR code has expired' },
        { status: 410 }
      );
    }

    // 6. Verificar que estudiante está inscrito en la materia
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('student_subjects')
      .select('id')
      .eq('student_id', user.id)
      .eq('subject_id', session.subject_id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Student not enrolled in this subject' },
        { status: 403 }
      );
    }

    // 7. Verificar que no ha registrado asistencia ya
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (!checkError && existingRecord) {
      return NextResponse.json(
        { error: 'Already checked in for this session' },
        { status: 409 }
      );
    }

    // 8. Registrar asistencia
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] 
      || request.headers.get('cf-connecting-ip')
      || 'unknown';

    const { data: record, error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_id: user.id,
        checked_in_at: new Date().toISOString(),
        ip_address: clientIp,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    // 9. Obtener nombre del estudiante para confirmación
    const { data: studentData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance: {
        id: record.id,
        student_name: studentData?.name,
        checked_in_at: record.checked_in_at,
      },
    });

  } catch (error) {
    console.error('Error in POST /api/attendance-records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
        </code>
      </step>

      <step number="6">
        <title>Crear Server Action para capturar escaneo (attendanceActions.ts)</title>
        <code language="typescript">
// /src/actions/attendanceActions.ts
'use server';

import { createServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function recordAttendanceFromQR(
  qrData: string
): Promise&lt;{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}&gt; {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'Not authenticated',
        error: 'Unauthorized',
      };
    }

    // Llamar a la API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/attendance-records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ qr_data: qrData }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.error || 'Failed to record attendance',
        error: error.error,
      };
    }

    const result = await response.json();

    // Revalidar la página de asistencias
    revalidatePath('/dashboard/student/my-attendance');

    return {
      success: true,
      message: '¡Asistencia registrada! Bienvenido/a.',
      data: result.attendance,
    };

  } catch (error) {
    console.error('Error in recordAttendanceFromQR:', error);
    return {
      success: false,
      message: 'An error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
        </code>
      </step>
    </section>

    <section name="3. Integración en Componentes React">
      <step number="7">
        <title>Componente QRGenerator.tsx para Docentes</title>
        <code language="typescript">
// /src/components/features/QRGenerator.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface QRGeneratorProps {
  subjectId: string;
  subjectName: string;
}

export default function QRGenerator({ subjectId, subjectName }: QRGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState&lt;string | null&gt;(null);
  const [qrData, setQrData] = useState&lt;{
    qr_image: string;
    sessionId: string;
    expires_at: string;
  } | null&gt;(null);

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/attendance-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject_id: subjectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate QR');
      }

      const result = await response.json();
      setQrData({
        qr_image: result.session.qr_image,
        sessionId: result.session.id,
        expires_at: result.session.expires_at,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.qr_image;
    link.download = `qr-${qrData.sessionId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        &lt;html&gt;
          &lt;head&gt;
            &lt;title&gt;QR Asistencia - ${subjectName}&lt;/title&gt;
            &lt;style&gt;
              body { text-align: center; padding: 20px; font-family: Arial, sans-serif; }
              h1 { margin-bottom: 30px; }
              img { max-width: 400px; }
              p { margin-top: 20px; color: #666; }
            &lt;/style&gt;
          &lt;/head&gt;
          &lt;body&gt;
            &lt;h1&gt;Código QR de Asistencia&lt;/h1&gt;
            &lt;p&gt;&lt;strong&gt;${subjectName}&lt;/strong&gt;&lt;/p&gt;
            &lt;img src="${qrData.qr_image}" alt="QR Code" /&gt;
            &lt;p&gt;Válido hasta: ${new Date(qrData.expires_at).toLocaleString()}&lt;/p&gt;
          &lt;/body&gt;
        &lt;/html&gt;
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const expiresAt = qrData ? new Date(qrData.expires_at) : null;
  const now = new Date();
  const timeRemaining = expiresAt ? Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60) : 0;

  return (
    &lt;div className="max-w-md mx-auto p-6 bg-white rounded-lg border border-gray-200"&gt;
      &lt;h2 className="text-2xl font-bold mb-4"&gt;{subjectName}&lt;/h2&gt;

      {error && (
        &lt;div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex gap-3"&gt;
          &lt;AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /&gt;
          &lt;p className="text-sm text-red-700"&gt;{error}&lt;/p&gt;
        &lt;/div&gt;
      )}

      {!qrData ? (
        &lt;Button
          onClick={handleGenerateQR}
          disabled={loading}
          className="w-full h-12 text-lg"
        &gt;
          {loading ? (
            &lt;&gt;
              &lt;Loader2 className="w-5 h-5 mr-2 animate-spin" /&gt;
              Generando...
            &lt;/&gt;
          ) : (
            'Generar QR de Asistencia'
          )}
        &lt;/Button&gt;
      ) : (
        &lt;div className="space-y-4"&gt;
          &lt;div className="bg-gray-100 p-4 rounded-lg flex justify-center"&gt;
            &lt;Image
              src={qrData.qr_image}
              alt="QR Code"
              width={300}
              height={300}
              className="bg-white p-2 rounded"
            /&gt;
          &lt;/div&gt;

          &lt;p className="text-center text-sm text-gray-600"&gt;
            Válido por: &lt;strong&gt;{timeRemaining} minutos&lt;/strong&gt;
          &lt;/p&gt;

          &lt;div className="flex gap-2"&gt;
            &lt;Button onClick={handleDownload} variant="outline" className="flex-1"&gt;
              &lt;Download className="w-4 h-4 mr-2" /&gt;
              Descargar
            &lt;/Button&gt;
            &lt;Button onClick={handlePrint} variant="outline" className="flex-1"&gt;
              Imprimir
            &lt;/Button&gt;
          &lt;/div&gt;

          &lt;Button
            onClick={() => setQrData(null)}
            variant="secondary"
            className="w-full"
          &gt;
            Generar Nuevo
          &lt;/Button&gt;
        &lt;/div&gt;
      )}
    &lt;/div&gt;
  );
}
        </code>
      </step>

      <step number="8">
        <title>Integrar QRScanner en página de escaneo (student dashboard)</title>
        <code language="typescript">
// /src/app/dashboard/student/scan-qr/page.tsx
'use client';

import { useState } from 'react';
import QRScanner from '@/components/features/QRScanner';
import { recordAttendanceFromQR } from '@/actions/attendanceActions';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScanQRPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [result, setResult] = useState&lt;{
    success: boolean;
    message: string;
    studentName?: string;
  } | null&gt;(null);
  const [loading, setLoading] = useState(false);

  const handleScanSuccess = async (scannedText: string) => {
    setLoading(true);
    try {
      const response = await recordAttendanceFromQR(scannedText);
      setResult({
        success: response.success,
        message: response.message,
        studentName: response.data?.student_name,
      });
      setShowScanner(false);
    } catch (error) {
      setResult({
        success: false,
        message: 'Error processing attendance',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    &lt;div className="max-w-2xl mx-auto p-6"&gt;
      &lt;h1 className="text-3xl font-bold mb-8"&gt;Escanear Asistencia&lt;/h1&gt;

      {result && (
        &lt;div className={`rounded-lg border p-4 mb-6 flex gap-4 ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}&gt;
          {result.success ? (
            &lt;CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" /&gt;
          ) : (
            &lt;AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" /&gt;
          )}
          &lt;div&gt;
            &lt;p className={`font-medium ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}&gt;
              {result.message}
            &lt;/p&gt;
            {result.studentName && (
              &lt;p className={`text-sm ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}&gt;
                Estudiante: {result.studentName}
              &lt;/p&gt;
            )}
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {!showScanner ? (
        &lt;Button
          onClick={() => setShowScanner(true)}
          disabled={loading}
          className="h-12 text-lg px-8"
        &gt;
          Abrir Cámara para Escanear
        &lt;/Button&gt;
      ) : (
        &lt;QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        /&gt;
      )}
    &lt;/div&gt;
  );
}
        </code>
      </step>
    </section>

    <section name="4. Base de Datos - SQL Setup">
      <step number="9">
        <title>Scripts SQL para crear tablas y políticas RLS</title>
        <code language="sql">
-- Tabla: attendance_sessions
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id TEXT PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_attendance_sessions_teacher_id ON public.attendance_sessions(teacher_id);
CREATE INDEX idx_attendance_sessions_subject_id ON public.attendance_sessions(subject_id);
CREATE INDEX idx_attendance_sessions_status ON public.attendance_sessions(status);
CREATE INDEX idx_attendance_sessions_expires_at ON public.attendance_sessions(expires_at);

-- RLS: Enable
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can only see their own sessions
CREATE POLICY "Teachers view own sessions"
  ON public.attendance_sessions
  FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- RLS Policy: Teachers can create sessions
CREATE POLICY "Teachers create sessions"
  ON public.attendance_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- RLS Policy: Teachers can update their sessions
CREATE POLICY "Teachers update own sessions"
  ON public.attendance_sessions
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

---

-- Tabla: attendance_records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  UNIQUE(session_id, student_id)
);

-- Índices
CREATE INDEX idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX idx_attendance_records_student_id ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_records_checked_in_at ON public.attendance_records(checked_in_at);

-- RLS: Enable
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can only see their own records
CREATE POLICY "Students view own records"
  ON public.attendance_records
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- RLS Policy: Teachers can see records of their subject sessions
CREATE POLICY "Teachers view session records"
  ON public.attendance_records
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM public.attendance_sessions 
      WHERE teacher_id = auth.uid()
    )
  );

-- RLS Policy: Students can insert their own records
CREATE POLICY "Students record own attendance"
  ON public.attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());
        </code>
      </step>
    </section>

    <section name="5. Testing & Debugging">
      <step number="10">
        <title>Testing checklist y debugging</title>
        <code language="markdown">
## Testing Checklist

### 1. Generación de QR
- [ ] Docente puede generar QR
- [ ] QR se visualiza correctamente
- [ ] QR tiene datos válidos (sessionId, subjectId, etc.)
- [ ] Sesión se crea en BD con expires_at correcto
- [ ] Múltiples QR generados tienen sessionId único

### 2. Escaneo de QR
- [ ] Cámara se inicializa correctamente
- [ ] Permiso de cámara se solicita
- [ ] QR se detecta y decodifica
- [ ] Funciona en navegadores: Chrome, Safari, Firefox
- [ ] Funciona en móvil (Android, iOS)

### 3. Validación de QR
- [ ] Rechaza QR expirado
- [ ] Rechaza QR de sesión cerrada
- [ ] Rechaza estudiante no inscrito
- [ ] Rechaza duplicado (mismo estudiante, misma sesión)
- [ ] Rechaza QR malformado

### 4. Registro de Asistencia
- [ ] Attendance record se crea en BD
- [ ] Timestamp es correcto
- [ ] IP se registra
- [ ] Confirmación visual en estudiante
- [ ] Docente ve el registro

### 5. RLS Security
- [ ] Estudiante A no ve asistencias de Estudiante B
- [ ] Docente A no ve materias de Docente B
- [ ] Estudiante no puede crear sesiones
- [ ] Docente no puede registrar asistencia

## Debug Commands

// Ver sesiones activas
SELECT * FROM public.attendance_sessions 
WHERE status = 'active' AND expires_at > NOW();

// Ver asistencias de un estudiante
SELECT ar.*, s.name as session_id
FROM public.attendance_records ar
JOIN public.attendance_sessions s ON ar.session_id = s.id
WHERE ar.student_id = 'USER_ID'
ORDER BY ar.checked_in_at DESC;

// Ver QR codes generados
SELECT id, qr_code, status, expires_at, created_at
FROM public.attendance_sessions
ORDER BY created_at DESC
LIMIT 10;
        </code>
      </step>
    </section>

  </implementation-guide>

  <best-practices>
    <item>
      <title>Seguridad</title>
      <description>
        - Siempre validar QR en servidor (nunca confiar solo en cliente)
        - Usar HTTPS en producción
        - Implementar rate limiting en endpoint de asistencia
        - Sanitizar input de QR antes de parsear
        - Log de todas las operaciones de asistencia para auditoría
      </description>
    </item>
    
    <item>
      <title>Performance</title>
      <description>
        - Usar índices en columnas de búsqueda frecuentes
        - Implementar connection pooling en Supabase
        - Cache de datos en cliente con SWR/React Query
        - Lazy load componentes de escáner
        - Comprimir imágenes QR
      </description>
    </item>

    <item>
      <title>UX</title>
      <description>
        - Feedback visual claro al escanear (sonido + animación)
        - Mostrar tiempo de expiración del QR
        - Permitir reintentos en caso de error
        - Confirmación clara de asistencia registrada
        - Manejo amigable de errores con mensajes claros
      </description>
    </item>

    <item>
      <title>Maintenance</title>
      <description>
        - Documentar cambios en schema de BD
        - Monitorear performance de queries
        - Limpiar sesiones expiradas periódicamente
        - Actualizar dependencias regularmente
        - Hacer backups de datos de asistencia
      </description>
    </item>
  </best-practices>

  <troubleshooting>
    <issue>
      <title>Error: "Permission denied" al crear sesión</title>
      <solution>
        Verificar que:
        1. Usuario está autenticado (getUser() retorna user)
        2. Usuario tiene role='teacher' en tabla users
        3. La materia pertenece al docente (subject.teacher_id == user.id)
        4. RLS policy permite INSERT a usuarios autenticados
      </solution>
    </issue>

    <issue>
      <title>Cámara no funciona en móvil</title>
      <solution>
        1. Asegurar HTTPS (requerido por navegadores)
        2. Verificar permisos de cámara en SO (iOS/Android)
        3. Probar en navegador nativo (no webview)
        4. Usar facingMode: 'environment' para cámara trasera
        5. Añadir meta tag: &lt;meta name="viewport" content="width=device-width"&gt;
      </solution>
    </issue>

    <issue>
      <title>QR válido pero rechazado con "Student not enrolled"</title>
      <solution>
        Verificar que existe registro en student_subjects:
        SELECT * FROM student_subjects 
        WHERE student_id = 'ID' AND subject_id = 'SUBJECT_ID';
        
        Si no existe, crear enrollment manualmente o permitir que estudian
te se auto-inscriba.
      </solution>
    </issue>
  </troubleshooting>

</claude-code-instructions>