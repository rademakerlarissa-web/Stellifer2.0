-- Alinha as colunas antigas do banco ao esquema esperado pelo backend.
ALTER TABLE conquista
    CHANGE COLUMN xp_conquista xp INT NOT NULL;

ALTER TABLE item_diario
    DROP CHECK item_diario_chk_1;

ALTER TABLE item_diario
    CHANGE COLUMN nota_geral nota TINYINT NULL;

ALTER TABLE item_diario
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'em_andamento' AFTER nota;

ALTER TABLE item_diario
    ADD CONSTRAINT item_diario_chk_1 CHECK (nota IS NULL OR nota BETWEEN 1 AND 5);
