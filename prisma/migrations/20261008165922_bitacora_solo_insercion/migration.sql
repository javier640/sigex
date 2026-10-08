-- This is an empty migration.
-- SIGEX · La bitácora es de solo inserción
--
-- Refuerza en la base de datos lo que la aplicación ya respeta: ningún
-- UPDATE, DELETE ni TRUNCATE sobre la tabla bitacora, venga de donde venga
-- (la app, un script o alguien conectado directo a la BD).

CREATE OR REPLACE FUNCTION bitacora_solo_insercion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'La bitácora es de solo inserción: % no está permitido', TG_OP;
END;
$$;

-- Bloquea modificar o borrar filas
CREATE TRIGGER bitacora_bloquear_update_delete
BEFORE UPDATE OR DELETE ON "bitacora"
FOR EACH ROW
EXECUTE FUNCTION bitacora_solo_insercion();

-- Bloquea vaciar la tabla completa
CREATE TRIGGER bitacora_bloquear_truncate
BEFORE TRUNCATE ON "bitacora"
FOR EACH STATEMENT
EXECUTE FUNCTION bitacora_solo_insercion();