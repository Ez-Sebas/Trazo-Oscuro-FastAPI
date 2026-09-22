-- ============================================================
-- MIGRACIÓN 01 — Estado de pago en las citas
-- ------------------------------------------------------------
-- Necesaria SOLO si la base de datos ya existía antes de este cambio.
-- Si vas a crear la base desde cero con bd_trazo_oscuro.sql, ignórala:
-- ese script ya incluye la columna.
--
-- Cómo ejecutarla (PostgreSQL):
--   psql -U tu_usuario -d bd_trazo_oscuro -f backend/scripts/migracion_01_estado_pago_citas.sql
--
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- ============================================================

BEGIN;

-- El cobro del servicio se registra aparte del avance de la cita, porque una
-- cita puede estar 'realizada' y seguir 'pendiente' de pago (y al revés:
-- cobrada por adelantado pero todavía sin realizar).
ALTER TABLE citas
    ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(15) NOT NULL DEFAULT 'pendiente';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'citas_estado_pago_check'
    ) THEN
        ALTER TABLE citas
            ADD CONSTRAINT citas_estado_pago_check
            CHECK (estado_pago IN ('pendiente', 'pagada'));
    END IF;
END $$;

-- Índices de apoyo para los filtros del dashboard de citas.
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_empleado ON citas(id_empleado);

COMMIT;
