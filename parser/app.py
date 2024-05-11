import os
import random
import requests
from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import psycopg2
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)

load_dotenv()

app = Flask(__name__)

def get_db_connection():
    logging.info("Connecting to database...")
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST'),
        database=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        port=os.getenv('POSTGRES_PORT', '5432')
    )

class SteamItemService:
    def __init__(self, api_key, appid):
        self.api_key = api_key
        self.appid = appid
        self.base_url = 'https://steamcommunity.com/market/search/render/'
        self.proxies = self.load_proxies()
        logging.info("Service initialized.")

    def load_proxies(self):
        try:
            with open('proxies.txt', 'r') as f:
                proxies = [line.strip() for line in f if line.strip()]
                logging.info("Proxies loaded.")
                return proxies
        except FileNotFoundError:
            logging.warning("Proxy file not found.")
            return []

    def get_steam_items(self):
        logging.info("Fetching Steam items...")
        params = {
            'appid': self.appid,
            'count': 100,
            'search_descriptions': 0,
            'sort_column': 'popular',
            'sort_dir': 'desc',
            'norender': 1
        }
        response = requests.get(self.base_url, params=params)
        items = response.json().get('results', [])
        logging.info(f"{len(items)} items fetched.")
        return items

    def save_items_to_db(self, items):
        conn = get_db_connection()
        cursor = conn.cursor()
        logging.info("Saving items to database...")
        for item in items:
            try:
                cursor.execute('''
                INSERT INTO steam_items (
                    name, hash_name, sell_listings, sell_price, sell_price_text, 
                    app_icon, app_name, tradable, market_name, market_hash_name, 
                    commodity, market_tradable_restriction, market_marketable_restriction,
                    marketable, type, background_color, icon_url, icon_url_large
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (hash_name) DO UPDATE SET
                    sell_listings = EXCLUDED.sell_listings,
                    sell_price = EXCLUDED.sell_price,
                    sell_price_text = EXCLUDED.sell_price_text,
                    app_icon = EXCLUDED.app_icon,
                    app_name = EXCLUDED.app_name,
                    tradable = EXCLUDED.tradable,
                    market_name = EXCLUDED.market_name,
                    market_hash_name = EXCLUDED.market_hash_name,
                    commodity = EXCLUDED.commodity,
                    market_tradable_restriction = EXCLUDED.market_tradable_restriction,
                    market_marketable_restriction = EXCLUDED.market_marketable_restriction,
                    marketable = EXCLUDED.marketable,
                    type = EXCLUDED.type,
                    background_color = EXCLUDED.background_color,
                    icon_url = EXCLUDED.icon_url,
                    icon_url_large = EXCLUDED.icon_url_large;
            ''', (
                item['name'], item['hash_name'], item.get('sell_listings', 0),
                item.get('sell_price', 0), item.get('sell_price_text', ''),
                item.get('app_icon', ''), item.get('app_name', ''),
                item.get('tradable', False), item.get('market_name', ''),
                item.get('market_hash_name', ''), item.get('commodity', False),
                item.get('market_tradable_restriction', 0), item.get('market_marketable_restriction', 0),
                item.get('marketable', False), item.get('type', ''),
                item.get('background_color', ''), item.get('icon_url', ''),
                item.get('icon_url_large', '')
            ))
            except Exception as e:
             logging.error(f"Error saving item {item['hash_name']}: {e}")
            continue  # Продолжаем обработку следующих предметов, не прерывая всю операцию

        conn.commit()
        cursor.close()
        conn.close()
        logging.info("Items saved to database.")



    def init_driver(self, proxy=None):
        """Initialize a Selenium WebDriver with optional proxy settings."""
        options = Options()
        options.add_argument('--headless')  
        # if proxy:  # Прокси временно отключен
        #     options.add_argument(f'--proxy-server={proxy}')
        return webdriver.Chrome(options=options)

 
    def fetch_item_nameid(self, name):
        logging.info(f"Запрашиваем данные для предмета: {name}")
        driver = self.init_driver()  # Прокси временно отключен
        url = f'https://steamcommunity.com/market/listings/{self.appid}/{name}'
        driver.get(url)
        
        # Поиск в HTML коде вызова ItemActivityTicker.Start и извлечение item_nameid
        html_content = driver.page_source
        start_index = html_content.find("ItemActivityTicker.Start(")
        if start_index != -1:
            start_index += len("ItemActivityTicker.Start(")
            end_index = html_content.find(")", start_index)
            item_nameid = html_content[start_index:end_index].strip()
            logging.info(f"item_nameid для {name}: {item_nameid}")
            print(f"item_nameid для {name}: {item_nameid}")
        else:
            logging.error(f"item_nameid для {name} не найден")
            print(f"ID для {name} не найден")

        driver.quit()


    def run(self):
        items = self.get_steam_items()
        self.save_items_to_db(items)
        for item in items:
            self.fetch_item_nameid(item['name'])


@app.route('/items/<int:appid>')
def items(appid):
    """Endpoint for retrieving and processing items by appid."""
    service = SteamItemService(os.getenv('API_KEY'), appid)
    service.run()
    return jsonify({"status": "Completed processing items"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
