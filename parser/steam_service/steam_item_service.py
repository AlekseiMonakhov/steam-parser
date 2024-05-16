import logging
import requests
from .utils import load_proxies
from .save_items_to_db import save_items_to_db
from .fetch_item_nameid import fetch_item_nameid
from .fetch_price_history import fetch_price_history
from .fetch_order_data import fetch_order_data

class SteamItemService:
    def __init__(self, api_key, appid):
        self.api_key = api_key
        self.appid = appid
        self.base_url = 'https://steamcommunity.com/market/search/render/'
        self.proxies = load_proxies()
        logging.info("Service initialized.")
        
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

    def run(self):
        items = self.get_steam_items()
        save_items_to_db(items)
        for item in items:
            fetch_item_nameid(item['name'], self.appid)
        fetch_price_history()
        fetch_order_data(self.appid)
