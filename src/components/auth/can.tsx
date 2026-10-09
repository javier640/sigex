"use client";


import type { ReactNode } from "react";
import type { Permiso } from "@/lib/permissions";
import { usePermission } from "@/hooks/use-permission";

type Props = {
  permiso: Permiso;
  children: ReactNode;
  alternativa?: ReactNode;
};

export function Can({ permiso, children, alternativa = null }: Props) {
  return usePermission(permiso) ? children : alternativa;
}