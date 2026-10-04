-- Registra a data em que uma obra foi adicionada ao diário.
-- Registros existentes permanecem sem data histórica conhecida.
ALTER TABLE item_diario
    ADD COLUMN data_adicionado DATETIME NULL DEFAULT NULL;
