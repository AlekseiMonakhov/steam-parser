import os
import random
import requests
import json
from flask import Flask, jsonify
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Загрузка переменных окружения
load_dotenv()
API_KEY = os.getenv('API_KEY')

app = Flask(__name__)

class SteamItemService:
    def __init__(self, api_key, appid):
        self.api_key = api_key
        self.appid = appid
        self.base_url = 'https://steamcommunity.com/market/search/render/'
        self.proxies = self.load_proxies()  # Загрузка списка прокси

    def load_proxies(self):
        """Загрузка списка прокси из файла."""
        try:
            with open('proxies.txt', 'r') as f:
                return [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            return []

    def get_steam_items(self):
        """Получить список предметов из Steam."""
        params = {
            'appid': self.appid,
            'count': 100,
            'search_descriptions': 0,
            'sort_column': 'popular',
            'sort_dir': 'desc',
            'norender': 1
        }
        response = requests.get(self.base_url, params=params)
        data = response.json()
        if data.get('success'):
            return data['results']
        else:
            return []

    def init_driver(self, proxy=None):
        """Инициализация драйвера Selenium с прокси."""
        chromedriver_autoinstaller.install()  # Убедиться, что ChromeDriver установлен
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        if proxy:
            chrome_options.add_argument(f'--proxy-server={proxy}')
        return webdriver.Chrome(options=chrome_options)

    def fetch_item_data(self, name):
        """Извлечение данных предмета через Selenium."""
        proxy = random.choice(self.proxies) if self.proxies else None
        driver = self.init_driver(proxy)
        url = f'https://steamcommunity.com/market/listings/{self.appid}/{name}'
        driver.get(url)
        data = driver.page_source
        driver.quit()
        print(f"Data for {name} retrieved with proxy {proxy}")
        # Здесь можно расширить логику для парсинга страницы
        return data

    def run(self):
        items = self.get_steam_items()
        print("Fetched items:", items)
        for item in items:
            self.fetch_item_data(item['name'])

@app.route('/items/<int:appid>')
def items(appid):
    """Эндпоинт для получения и обработки предметов по appid."""
    service = SteamItemService(API_KEY, appid)
    service.run()
    return jsonify({"status": "Completed processing items"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
