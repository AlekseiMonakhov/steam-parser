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

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Загрузка переменных окружения
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
            cursor.execute('''
                INSERT INTO steam_items (name, hash_name, sell_listings, sell_price, sell_price_text, app_icon, app_name)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (hash_name) DO UPDATE SET
                sell_listings = EXCLUDED.sell_listings,
                sell_price = EXCLUDED.sell_price,
                sell_price_text = EXCLUDED.sell_price_text;
            ''', (
                item['name'], item['hash_name'], item['sell_listings'],
                item['sell_price'], item['sell_price_text'], item['app_icon'],
                item['app_name']
            ))
        conn.commit()
        cursor.close()
        conn.close()
        logging.info("Items saved to database.")

    def init_driver(self, proxy=None):
        """Initialize a Selenium WebDriver with optional proxy settings."""
        options = Options()
        options.add_argument('--headless')  # Important for running in non-GUI environments
        # if proxy:  # Прокси временно отключен
        #     options.add_argument(f'--proxy-server={proxy}')
        return webdriver.Chrome(options=options)

    def parse_graph_data(self, driver):
        """Извлекает данные графика."""
        data = []
        tooltips = driver.find_elements(By.CLASS_NAME, 'jplot-highlighter-tooltip')
        for tooltip in tooltips:
            # Извлекаем дату, цену и количество продаж
            date = tooltip.find_element(By.CLASS_NAME, 'priceHistoryTime').text.strip()
            strong_elements = tooltip.find_elements(By.TAG_NAME, 'strong')
            price = strong_elements[1].text.strip()
            sold = strong_elements[2].text.strip().split()[0]
            data.append({
                'date': date,
                'price': price,
                'sold': sold
            })
        return data



    def fetch_item_data(self, name):
        logging.info(f"Fetching data for item: {name}")
        driver = self.init_driver()  # Прокси отключен
        url = f'https://steamcommunity.com/market/listings/{self.appid}/{name}'
        driver.get(url)
    
        # Ожидание загрузки графика
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".jqplot-event-canvas"))
        )
    
        # Сбор данных за месяц
        data_points = driver.find_elements(By.CSS_SELECTOR, ".jqplot-xaxis-tick")
        for point in data_points:
            ActionChains(driver).move_to_element(point).perform()  # Перемещение курсора к точке
            tooltip = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, ".jqplot-highlighter-tooltip"))
            )
            date = tooltip.find_element(By.TAG_NAME, "strong").text
            details = tooltip.text.split('\n')[1:]  # Разделение данных о цене и количестве
            print(f"Date: {date}, Price: {details[0]}, Sold: {details[1]}")
            logging.info(f"Data for {name} on {date}: {details[0]}, {details[1]}")
    
        driver.quit()


    def run(self):
        items = self.get_steam_items()
        self.save_items_to_db(items)
        for item in items:
            self.fetch_item_data(item['name'])


@app.route('/items/<int:appid>')
def items(appid):
    """Endpoint for retrieving and processing items by appid."""
    service = SteamItemService(os.getenv('API_KEY'), appid)
    service.run()
    return jsonify({"status": "Completed processing items"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
