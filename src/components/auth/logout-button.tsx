/**
 * Botón de cierre de sesión.
 * Es un Server Component: el <form> llama directo a la Server Action.
 * Solo el botón interno es cliente, para mostrar el estado "Saliendo…".
 */
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