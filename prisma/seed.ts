/**
 * SIGEX · Seed de base de datos
 *
 * Ejecutar con:  npm run db:seed
 *
 * Es idempotente: se puede correr varias veces sin duplicar datos.
 *  - Permisos y roles: se crean o actualizan; los permisos de cada rol
 *    se sincronizan exactamente con el catálogo de este archivo.
 *  - Usuarios: se crean o actualizan (incluida la contraseña, para que
 *    siempre puedas volver a las credenciales de prueba).
 *  - Expedientes: solo se crean si no existen; NO se sobrescriben los
 *    cambios que hayas hecho al probar la app.
 */
import { config } from "dotenv";
import {
  PrismaClient,
  EstatusExpediente,
  PrioridadExpediente,
} from "@prisma/client";
import { hash } from "bcryptjs";

config({ quiet: true });

// El seed corre fuera de Next.js, por eso usa su propio cliente
// en lugar del singleton de src/lib/db.ts.
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────

const BCRYPT_COST = 12;
const PASSWORD_DEFAULT = "Sigex2026!";
const PASSWORD = process.env.SEED_PASSWORD ?? PASSWORD_DEFAULT;

/**
 * Si defines SEED_EMAIL (el correo con el que registraste Resend),
 * los usuarios usarán alias: tucorreo+admin@gmail.com, etc.
 * Si no, se usan correos ficticios @sigex.test (no recibirán correos).
 */
const SEED_EMAIL = process.env.SEED_EMAIL;

// El admin usa el correo exacto de la cuenta de Resend: es el único destinatario
// permitido al enviar desde onboarding@resend.dev sin dominio verificado.
const ALIAS_CORREO_REAL = "admin";

function emailPara(alias: string): string {
  if (!SEED_EMAIL) return `${alias}@sigex.test`;
  if (alias === ALIAS_CORREO_REAL) return SEED_EMAIL;
  const [local, dominio] = SEED_EMAIL.split("@");
  return `${local}+${alias}@${dominio}`;
}

// ─────────────────────────────────────────────
// Catálogo de permisos y roles
// ─────────────────────────────────────────────

const PERMISOS = [
  { clave: "expedientes:ver", descripcion: "Listado y detalle de expedientes" },
  { clave: "expedientes:crear", descripcion: "Alta de expedientes" },
  { clave: "expedientes:editar", descripcion: "Edición de expedientes propios" },
  {
    clave: "expedientes:editar_todos",
    descripcion: "Edición de expedientes creados por cualquier usuario",
  },
  {
    clave: "expedientes:cambiar_estatus",
    descripcion: "Cambio de estatus de expedientes",
  },
  { clave: "expedientes:eliminar", descripcion: "Baja lógica de expedientes" },
  {
    clave: "usuarios:gestionar",
    descripcion: "Alta, edición y desactivación de usuarios",
  },
  { clave: "bitacora:ver", descripcion: "Consulta de la bitácora de auditoría" },
] as const;

type ClavePermiso = (typeof PERMISOS)[number]["clave"];

const ROLES: { nombre: string; descripcion: string; permisos: ClavePermiso[] }[] = [
  {
    nombre: "Administrador",
    descripcion: "Responsable del sistema. Acceso total.",
    permisos: PERMISOS.map((p) => p.clave),
  },
  {
    nombre: "Supervisor",
    descripcion: "Revisa y aprueba el trabajo.",
    permisos: [
      "expedientes:ver",
      "expedientes:crear",
      "expedientes:editar",
      "expedientes:editar_todos",
      "expedientes:cambiar_estatus",
    ],
  },
  {
    nombre: "Capturista",
    descripcion: "Registra información. Edita solo sus expedientes.",
    permisos: ["expedientes:ver", "expedientes:crear", "expedientes:editar"],
  },
  {
    nombre: "Consulta",
    descripcion: "Solo lectura.",
    permisos: ["expedientes:ver"],
  },
];

// ─────────────────────────────────────────────
// Usuarios de prueba
// ─────────────────────────────────────────────

const USUARIOS = [
  { alias: "admin", nombre: "Ana Administradora", rol: "Administrador", activo: true },
  { alias: "supervisor", nombre: "Sergio Supervisor", rol: "Supervisor", activo: true },
  { alias: "capturista", nombre: "Carla Capturista", rol: "Capturista", activo: true },
  // Segundo capturista para probar que no puede editar expedientes ajenos
  { alias: "capturista2", nombre: "Carlos Capturista", rol: "Capturista", activo: true },
  { alias: "consulta", nombre: "Consuelo Consulta", rol: "Consulta", activo: true },
  // Usuario desactivado para probar el bloqueo de login
  { alias: "inactivo", nombre: "Iván Inactivo", rol: "Capturista", activo: false },
];

// ─────────────────────────────────────────────
// Datos de ejemplo para expedientes
// ─────────────────────────────────────────────

const TOTAL_EXPEDIENTES = 30;

const TITULOS = [
  "Solicitud de constancia de no adeudo",
  "Revisión de pago de tenencia",
  "Aclaración de multa vehicular",
  "Trámite de cambio de propietario",
  "Reposición de tarjeta de circulación",
  "Solicitud de devolución de pago duplicado",
  "Alta de vehículo en padrón",
  "Baja de placas por robo",
  "Corrección de datos del contribuyente",
  "Solicitud de copia certificada",
];

const SOLICITANTES = [
  "María López Hernández",
  "Juan Pérez García",
  "Rosa Martínez Sánchez",
  "Luis Ramírez Torres",
  "Patricia Gómez Flores",
  "Jorge Díaz Morales",
  "Elena Cruz Reyes",
  "Ricardo Vargas Castillo",
];

const ESTATUS: EstatusExpediente[] = [
  EstatusExpediente.abierto,
  EstatusExpediente.en_revision,
  EstatusExpediente.cerrado,
];

const PRIORIDADES: PrioridadExpediente[] = [
  PrioridadExpediente.baja,
  PrioridadExpediente.media,
  PrioridadExpediente.alta,
  PrioridadExpediente.urgente,
];

// Formato provisional de folio: EXP-2026-000001
function generarFolio(anio: number, consecutivo: number): string {
  return `EXP-${anio}-${String(consecutivo).padStart(6, "0")}`;
}

// ─────────────────────────────────────────────
// Validaciones previas
// ─────────────────────────────────────────────

function validarConfiguracion(): void {
  if (PASSWORD.length < 8) {
    throw new Error("SEED_PASSWORD debe tener al menos 8 caracteres.");
  }
  if (process.env.NODE_ENV === "production" && !process.env.SEED_PASSWORD) {
    throw new Error(
      "En producción no se permite la contraseña por defecto. Define SEED_PASSWORD.",
    );
  }
  if (SEED_EMAIL && !/^[^\s@+]+@[^\s@]+\.[^\s@]+$/.test(SEED_EMAIL)) {
    throw new Error("SEED_EMAIL no es un correo válido (y no debe incluir '+').");
  }
}

// ─────────────────────────────────────────────
// Pasos del seed
// ─────────────────────────────────────────────

async function seedPermisos(): Promise<Map<string, number>> {
  for (const p of PERMISOS) {
    await prisma.permiso.upsert({
      where: { clave: p.clave },
      update: { descripcion: p.descripcion },
      create: { clave: p.clave, descripcion: p.descripcion },
    });
  }
  const permisos = await prisma.permiso.findMany({ select: { id: true, clave: true } });
  return new Map(permisos.map((p) => [p.clave, p.id]));
}

async function seedRoles(idPorClave: Map<string, number>): Promise<Map<string, number>> {
  for (const r of ROLES) {
    const rol = await prisma.rol.upsert({
      where: { nombre: r.nombre },
      update: { descripcion: r.descripcion },
      create: { nombre: r.nombre, descripcion: r.descripcion },
    });

    const permisoIds = r.permisos.map((clave) => {
      const id = idPorClave.get(clave);
      if (id === undefined) throw new Error(`Permiso no encontrado: ${clave}`);
      return id;
    });

    // Sincroniza la tabla pivote: quita lo que sobra y agrega lo que falta
    await prisma.$transaction([
      prisma.rolPermiso.deleteMany({
        where: { rolId: rol.id, permisoId: { notIn: permisoIds } },
      }),
      prisma.rolPermiso.createMany({
        data: permisoIds.map((permisoId) => ({ rolId: rol.id, permisoId })),
        skipDuplicates: true,
      }),
    ]);
  }
  const roles = await prisma.rol.findMany({ select: { id: true, nombre: true } });
  return new Map(roles.map((r) => [r.nombre, r.id]));
}

async function seedUsuarios(rolPorNombre: Map<string, number>): Promise<Map<string, number>> {
  const passwordHash = await hash(PASSWORD, BCRYPT_COST);
  const idPorAlias = new Map<string, number>();

  for (const u of USUARIOS) {
    const rolId = rolPorNombre.get(u.rol);
    if (rolId === undefined) throw new Error(`Rol no encontrado: ${u.rol}`);

    const email = emailPara(u.alias);
    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: { nombre: u.nombre, rolId, activo: u.activo, passwordHash },
      create: { nombre: u.nombre, email, rolId, activo: u.activo, passwordHash },
    });

    // Un usuario inactivo no debe conservar sesiones vigentes
    if (!u.activo) {
      await prisma.sesion.deleteMany({ where: { usuarioId: usuario.id } });
    }

    idPorAlias.set(u.alias, usuario.id);
  }
  return idPorAlias;
}

async function seedExpedientes(idPorAlias: Map<string, number>): Promise<void> {
  const creadores = ["admin", "supervisor", "capturista", "capturista2"].map((alias) => {
    const id = idPorAlias.get(alias);
    if (id === undefined) throw new Error(`Usuario no encontrado: ${alias}`);
    return id;
  });

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const UN_DIA_MS = 24 * 60 * 60 * 1000;

  for (let i = 1; i <= TOTAL_EXPEDIENTES; i++) {
    const folio = generarFolio(anio, i);
    // Fechas escalonadas hacia atrás para que el listado se vea realista
    const creadoEn = new Date(ahora.getTime() - (TOTAL_EXPEDIENTES - i) * UN_DIA_MS);
    // Algunos dados de baja lógica para probar que no aparecen en el listado
    const eliminadoEn = i % 15 === 0 ? ahora : null;

    await prisma.expediente.upsert({
      where: { folio },
      update: {}, // no sobrescribe cambios hechos al probar
      create: {
        folio,
        titulo: TITULOS[i % TITULOS.length],
        descripcion: `Expediente de prueba número ${i} generado por el seed.`,
        solicitante: SOLICITANTES[i % SOLICITANTES.length],
        estatus: ESTATUS[i % ESTATUS.length],
        prioridad: PRIORIDADES[i % PRIORIDADES.length],
        creadoPorId: creadores[i % creadores.length],
        creadoEn,
        eliminadoEn,
      },
    });
  }
}

// ─────────────────────────────────────────────
// Ejecución
// ─────────────────────────────────────────────

async function main(): Promise<void> {
  validarConfiguracion();

  console.log("embrando permisos...");
  const idPorClave = await seedPermisos();

  console.log("Sembrando roles y asignando permisos...");
  const rolPorNombre = await seedRoles(idPorClave);

  console.log("Sembrando usuarios de prueba...");
  const idPorAlias = await seedUsuarios(rolPorNombre);

  console.log("Sembrando expedientes de ejemplo...");
  await seedExpedientes(idPorAlias);

  console.log("\nSeed completado. Credenciales de prueba:\n");
  console.table(
    USUARIOS.map((u) => ({
      rol: u.rol,
      email: emailPara(u.alias),
      activo: u.activo ? "sí" : "no",
    })),
  );
  console.log(
    process.env.SEED_PASSWORD
      ? "Contraseña: la definida en SEED_PASSWORD"
      : `Contraseña para todos: ${PASSWORD_DEFAULT}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Error en el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });