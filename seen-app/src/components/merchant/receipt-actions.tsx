"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  return (
    <Button type="button" variant="primary" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden />
      Print or save as PDF
    </Button>
  );
}
