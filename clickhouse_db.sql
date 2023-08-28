-- ##############
-- ## Empresas ##
-- ##############

CREATE TABLE IF NOT EXISTS cnpjdb.empresas (
    cnpj String,
    razao_social String,
    natureza_juridica String,
    qualificacao_responsavel String,
    capital_social Decimal64(2),
    porte_empresa String, 
    ente_federativo_responsavel String
) ENGINE = MergeTree() ORDER BY cnpj;

-- RUN ON clickhouse-client >>> INSERT INTO cnpjdb.empresas FROM INFILE './downloads/empresas/parquet/*.parquet' FORMAT Parquet;