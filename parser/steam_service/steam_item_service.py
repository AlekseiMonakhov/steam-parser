import logging
import requests
from concurrent.futures import ThreadPoolExecutor
from .utils import load_proxies
from .save_items_to_db import save_items_to_db
from .fetch_item_nameid import ItemNameIdParser
from .fetch_price_history import fetch_price_history
from .fetch_order_data import fetch_order_data

class SteamItemService:
    def __init__(self, api_key, appid):
        self.api_key = api_key
        self.appid = appid
        self.base_url = 'https://steamcommunity.com/market/search/render/'
        logging.info("Service initialized.")

    def get_steam_items(self):
        logging.info("Fetching Steam items...")
        params = {
            'appid': self.appid,
            'search_descriptions': 0,
            'sort_dir': 'desc',
            'norender': 1
        }
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            items = data.get('results', [])
            logging.info(f"{len(items)} items fetched.")
            return items
        except requests.RequestException as e:
            logging.error(f"Failed to fetch items: {e}")
            return []
        except ValueError:
            logging.error("Invalid JSON response")
            return []

    def run(self):
        with ThreadPoolExecutor() as executor:
            try:
                future_items = executor.submit(self.get_steam_items)
                items = future_items.result()
                if items:
                    executor.submit(save_items_to_db, items)
                parser = ItemNameIdParser()
                executor.submit(parser.fetch_item_nameids, self.appid)
                executor.submit(fetch_order_data, self.appid)
                executor.submit(fetch_price_history, self.appid)
            except Exception as e:
                logging.error(f"Error in service run: {e}")