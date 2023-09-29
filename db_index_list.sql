CREATE UNIQUE INDEX empresas_cnpj_idx
ON opencnpj_set23.empresas (cnpj_basico);

CREATE INDEX estabelecimentos_cnpj_idx
ON opencnpj_set23.estabelecimentos (cnpj_basico);

CREATE UNIQUE INDEX simples_cnpj_idx
ON opencnpj_set23.simples (cnpj_basico);

CREATE INDEX socios_cnpj_idx
ON opencnpj_set23.socios (cnpj_basico);