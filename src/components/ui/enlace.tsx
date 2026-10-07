/**
 * Enlace interno con el estilo de la app.
 */
import Link from "next/link";
import type { ComponentProps } from "react";

export function Enlace({ className = "", ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`rounded font-medium text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${className}`}
      {...props}
    />
  );
}