import os
import random
import requests
from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import psycopg2
from dotenv import load_dotenv
import logging
import re

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
            'count': 10,
            'search_descriptions': 0,
            'sort_column': 'popular',
            'sort_dir': 'desc',
            'norender': 1
        }
        response = requests.get(self.base_url, params=params)
        if response.status_code == 200:
            try:
                data = response.json()
                items = data.get('results', [])
                logging.info(f"{len(items)} items fetched.")
                return items
            except ValueError:
                logging.error("Invalid JSON response")
        else:
            logging.error(f"Failed to fetch items. Status code: {response.status_code}")
        return []

    def save_items_to_db(self, items):
        conn = get_db_connection()
        cursor = conn.cursor()
        logging.info("Saving items to database...")
        for item in items:
            asset_description = item.get('asset_description', {})
            tradable = bool(asset_description.get('tradable', 0))  # Преобразуем 0/1 в True/False
            market_hash_name = asset_description.get('market_hash_name', '')
            market_tradable_restriction = asset_description.get('market_tradable_restriction', 0)
            marketable = bool(asset_description.get('marketable', 0))
            commodity = bool(asset_description.get('commodity', 0))  # Преобразуем 0/1 в True/False

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
                    icon_url_large = EXCLUDED.icon_url_large
                ''', (
                    item['name'], item['hash_name'], item.get('sell_listings', 0),
                    item.get('sell_price', 0), item.get('sell_price_text', ''),
                    item.get('app_icon', ''), item.get('app_name', ''),
                    tradable, item.get('name', ''), market_hash_name,
                    commodity, 
                    market_tradable_restriction, 0,
                    marketable, asset_description.get('type', ''),
                    asset_description.get('background_color', ''), 
                    asset_description.get('icon_url', ''), asset_description.get('icon_url_large', '')
                ))
                conn.commit()
                logging.info(f"Successfully saved or updated item: {item['hash_name']}")
            except Exception as e:
                conn.rollback()  
                logging.error(f"Error saving item {item['hash_name']}: {e}")
                continue 

        cursor.close()
        conn.close()
        logging.info("Items saved to database.")

    def init_driver(self, proxy=None):
        options = Options()
        options.add_argument('--headless')  
        return webdriver.Chrome(options=options)

    def fetch_item_nameid(self, name):
        logging.info(f"Fetching item_nameid for item: {name}")
        driver = self.init_driver()
        url = f'https://steamcommunity.com/market/listings/{self.appid}/{name}'
        driver.get(url)
        
        try:
            html_content = driver.page_source
            start_index = html_content.find("ItemActivityTicker.Start(")
            if start_index != -1:
                start_index += len("ItemActivityTicker.Start(")
                end_index = html_content.find(")", start_index)
                item_nameid = html_content[start_index:end_index].strip()
                logging.info(f"item_nameid for {name}: {item_nameid}")
                self.update_item_nameid(name, item_nameid)
            else:
                logging.error(f"item_nameid for {name} not found")
        finally:
            driver.quit()

    def update_item_nameid(self, name, item_nameid):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''
            UPDATE steam_items
            SET item_nameid = %s
            WHERE name = %s
            ''', (item_nameid, name))
            conn.commit()
            logging.info(f"Successfully updated item_nameid: {item_nameid} for item with name: {name}")
        except Exception as e:
            conn.rollback()
            logging.error(f"Error updating item_nameid {item_nameid} for item with name {name}: {e}")
        finally:
            cursor.close()
            conn.close()

    def fetch_price_history(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, market_hash_name FROM steam_items WHERE market_hash_name IS NOT NULL")
        items = cursor.fetchall()
        logging.info(f"Fetched {len(items)} items with valid market_hash_name from database.")

        session = requests.Session()
        session.cookies.set('steamLoginSecure', os.getenv('STEAM_LOGIN_SECURE'))
        session.cookies.set('sessionid', os.getenv('STEAM_SESSIONID'))
        session.cookies.set('browserid', os.getenv('STEAM_BROWSERID'))
        session.cookies.set('steamCountry', os.getenv('STEAM_COUNTRY'))

        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Accept-Language': 'en-US,en;q=0.9'
        })

        for item_id, market_hash_name in items:
            url = f"http://steamcommunity.com/market/pricehistory/?country=KZ&language=english&currency=37&appid=730&market_hash_name={market_hash_name}"
            response = session.get(url)
            logging.info(f"URL: {url}")
            logging.info(f"Response Status Code: {response.status_code}, Response Body: {response.text}")

            try:
                data = response.json()
            except ValueError:
                logging.error("Failed to decode JSON from response")
                continue

            logging.info(f"Response from API for {market_hash_name}: {data}")
            if isinstance(data, dict) and data.get('success', True):
                for entry in data['prices']:
                    date, price, volume = entry
                    formatted_date = date[:-4] + date[-2:]  # Remove '+0' assuming all dates are GMT+0
                    cursor.execute('''
                    INSERT INTO price_history (item_id, date, price, volume)
                    SELECT %s, TO_TIMESTAMP(%s, 'Mon DD YYYY HH24'), %s, %s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM price_history WHERE item_id = %s AND date = TO_TIMESTAMP(%s, 'Mon DD YYYY HH24')
                    )
                    ''', (item_id, formatted_date, price, volume, item_id, formatted_date))
                    logging.info(f"Price history saved for item {item_id} on {formatted_date}: price {price}, volume {volume}")
            else:
                logging.error(f"Failed to fetch or parse price history for item {item_id}. Response: {data}")

        conn.commit()
        cursor.close()
        conn.close()
        logging.info("Completed updating price history.")
    
    def fetch_order_data(self):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, item_nameid FROM steam_items WHERE item_nameid IS NOT NULL")
        items = cursor.fetchall()
        logging.info(f"Fetched {len(items)} items with valid item_nameid from database.")

        session = requests.Session()
        session.cookies.set('steamLoginSecure', os.getenv('STEAM_LOGIN_SECURE'))
        session.cookies.set('sessionid', os.getenv('STEAM_SESSIONID'))
        session.cookies.set('browserid', os.getenv('STEAM_BROWSERID'))
        session.cookies.set('steamCountry', os.getenv('STEAM_COUNTRY'))

        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Accept-Language': 'en-US,en;q=0.9'
        })

        for item_id, item_nameid in items:
            if not item_nameid:
                logging.warning(f"Skipping item with id {item_id} because item_nameid is None")
                continue
            
            url = f"https://steamcommunity.com/market/itemordershistogram?country=KZ&language=english&currency=37&item_nameid={item_nameid}&two_factor=0&norender=1"
            response = session.get(url)
            logging.info(f"URL: {url}")
            logging.info(f"Response Status Code: {response.status_code}, Response Body: {response.text}")

            try:
                data = response.json()
            except ValueError:
                logging.error("Failed to decode JSON from response")
                continue

            logging.info(f"Response from API for item_nameid {item_nameid}: {data}")
            if isinstance(data, dict) and data.get('success', True):
                for order in data['sell_order_table']:
                    try:
                        price_str = re.sub(r'[^0-9,]', '', order['price']).replace(',', '.')
                        price = float(price_str)
                        quantity = int(order['quantity'].replace(',', '').replace(' ', ''))
                        cursor.execute('''
                        INSERT INTO item_orders (item_id, order_type, price, quantity)
                        SELECT %s, %s, %s, %s
                        WHERE NOT EXISTS (
                            SELECT 1 FROM item_orders WHERE item_id = %s AND order_type = %s AND price = %s AND quantity = %s
                        )
                        ''', (item_id, 'sell', price, quantity, item_id, 'sell', price, quantity))
                        logging.info(f"Sell order saved for item {item_id}: price {price}, quantity {quantity}")
                    except ValueError as e:
                        logging.error(f"Failed to parse sell order for item {item_id}: {e}")
                        continue
                
                for order in data['buy_order_table']:
                    try:
                        price_str = re.sub(r'[^0-9,]', '', order['price']).replace(',', '.')
                        price = float(price_str)
                        quantity = int(order['quantity'].replace(',', '').replace(' ', ''))
                        cursor.execute('''
                        INSERT INTO item_orders (item_id, order_type, price, quantity)
                        SELECT %s, %s, %s, %s
                        WHERE NOT EXISTS (
                            SELECT 1 FROM item_orders WHERE item_id = %s AND order_type = %s AND price = %s AND quantity = %s
                        )
                        ''', (item_id, 'buy', price, quantity, item_id, 'buy', price, quantity))
                        logging.info(f"Buy order saved for item {item_id}: price {price}, quantity {quantity}")
                    except ValueError as e:
                        logging.error(f"Failed to parse buy order for item {item_id}: {e}")
                        continue
            else:
                logging.error(f"Failed to fetch or parse order data for item {item_id}. Response: {data}")

        conn.commit()
        cursor.close()
        conn.close()
        logging.info("Completed updating order data.")

    def run(self):
        items = self.get_steam_items()
        self.save_items_to_db(items)
        for item in items:
            self.fetch_item_nameid(item['name'])
        self.fetch_price_history()
        self.fetch_order_data()
        
@app.route('/items/<int:appid>')
def items(appid):
    service = SteamItemService(os.getenv('API_KEY'), appid)
    service.run()
    return jsonify({"status": "Completed processing items"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
