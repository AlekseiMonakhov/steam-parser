import psycopg2
import logging
from config import Config

def get_db_connection():
    logging.info("Connecting to database...")
    return psycopg2.connect(
        host=Config.POSTGRES_HOST,
        database=Config.POSTGRES_DB,
        user=Config.POSTGRES_USER,
        password=Config.POSTGRES_PASSWORD,
        port=Config.POSTGRES_PORT
    )
