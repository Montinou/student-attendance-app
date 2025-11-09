"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"
import { QRScannerDialog } from "./qr-scanner-dialog"

export function QRScannerButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg">
        <QrCode className="h-5 w-5 mr-2" />
        Escanear QR
      </Button>
      <QRScannerDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
