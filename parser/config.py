import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    POSTGRES_HOST = os.getenv('POSTGRES_HOST')
    POSTGRES_DB = os.getenv('POSTGRES_DB')
    POSTGRES_USER = os.getenv('POSTGRES_USER')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
    API_KEY = os.getenv('API_KEY')
    STEAM_LOGIN_SECURE = os.getenv('STEAM_LOGIN_SECURE')
    STEAM_SESSIONID = os.getenv('STEAM_SESSIONID')
    STEAM_BROWSERID = os.getenv('STEAM_BROWSERID')
    STEAM_COUNTRY = os.getenv('STEAM_COUNTRY')
