/**
 * SIGEX · Plantilla del correo de recuperación de contraseña
 *
 * Los clientes de correo (Gmail, Outlook) no cargan hojas de estilo ni
 * Tailwind: solo respetan estilos en línea y tablas. Por eso aquí los
 * colores van como hexadecimales en `style`. Son los equivalentes de la
 * paleta de Tailwind que usa la app (teal-800, slate-900, slate-600, slate-100).
 */

const COLORES = {
  teal800: "#115e59",
  slate900: "#0f172a",
  slate600: "#475569",
  slate100: "#f1f5f9",
  amber200: "#fde68a",
};

type Datos = {
  nombre: string;
  enlace: string;
  minutos: number;
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function plantillaRecuperacion({ nombre, enlace, minutos }: Datos) {
  const asunto = "Restablece tu contraseña de SIGEX";
  const nombreSeguro = escaparHtml(nombre);
  const enlaceSeguro = escaparHtml(enlace);

  const texto = [
    `Hola, ${nombre}:`,
    "",
    "Recibimos una solicitud para restablecer la contraseña de tu cuenta de SIGEX.",
    `Abre este enlace para definir una nueva. Vence en ${minutos} minutos y solo funciona una vez:`,
    "",
    enlace,
    "",
    "Si no fuiste tú, ignora este correo: tu contraseña actual sigue funcionando.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:${COLORES.slate100};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORES.slate100};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${COLORES.teal800};padding:20px 32px;border-bottom:4px solid ${COLORES.amber200};">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">SIGEX</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:${COLORES.slate900};font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hola, ${nombreSeguro}:</p>
                <p style="margin:0 0 24px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el botón para definir una nueva.</p>
                <p style="margin:0 0 24px;">
                  <a href="${enlaceSeguro}" style="display:inline-block;background:${COLORES.teal800};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">Definir nueva contraseña</a>
                </p>
                <p style="margin:0 0 8px;color:${COLORES.slate600};font-size:13px;">El enlace vence en ${minutos} minutos y solo funciona una vez.</p>
                <p style="margin:0;color:${COLORES.slate600};font-size:13px;">Si no fuiste tú, ignora este correo: tu contraseña actual sigue funcionando.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { asunto, html, texto };
}