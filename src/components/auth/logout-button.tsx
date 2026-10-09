import { logoutAction } from "@/actions/auth.actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <SubmitButton variante="secundario" textoPendiente="Saliendo…" className={className}>
        Cerrar sesión
      </SubmitButton>
    </form>
  );
}