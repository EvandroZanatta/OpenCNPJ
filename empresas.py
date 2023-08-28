from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType
from pyspark.sql.functions import regexp_replace, col

print("Start Spark")

# Create session Spark
spark = SparkSession.builder \
    .appName("ProcessCNPJ") \
    .config("spark.sql.decimalOperations.showTrailingZeroes", "false") \
    .getOrCreate()

# set the path of csv files
caminho_arquivo = "./downloads/empresas"

# Define the schema based on the dictionary
schema = StructType([
    StructField("cnpj", StringType(), True),
    StructField("razao_social", StringType(), True),
    StructField("natureza_juridica", StringType(), True),
    StructField("qualificacao_responsavel", StringType(), True),
    StructField("capital_social", StringType(), True),
    StructField("porte_empresa", StringType(), True),
    StructField("ente_federativo_responsavel", StringType(), True)
])

print("Read CSVs")

# Read CSV file into a DataFrame with custom header
df = spark.read.option("header", "false").option("delimiter", ";").schema(schema).csv(caminho_arquivo)

print("Trasnforme data")

# Adjust data formatting
df = df.withColumn("capital_social", regexp_replace(col("capital_social"), ",", "."))
df = df.withColumn("capital_social", col("capital_social").cast("double"))

print('Start export')

# Export data in .parquet
df.write.parquet(
    path='./downloads/empresas/parquet',
    mode='overwrite',
)

print('Parquet files exported')

spark.stop()