-- Imagens são armazenadas como data URLs base64 e excedem VARCHAR(500).
ALTER TABLE item_diario
    MODIFY COLUMN imagens LONGTEXT NULL;

ALTER TABLE obra
    MODIFY COLUMN capa LONGTEXT NULL;
