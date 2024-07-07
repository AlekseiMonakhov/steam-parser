import logging
import requests
from database import get_db_connection

class ItemRarityQualityItemgroupParser:
    def __init__(self):
        self.api_url_template = "https://steamwebapi.com/steam/api/items?key=OZKWQRS9PTYH84YE&currency=KZT&game={game}&sort_by=winLoss&price_min=1"

    def fetch_and_update_items(self, appid, game):
        logging.info(f"Fetching items for game: {game} with appid: {appid}")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        SELECT market_hash_name FROM steam_items
        WHERE appid = %s
        ''', (appid,))
        items = cursor.fetchall()
        cursor.close()

        if not items:
            logging.info(f"No items to update for appid: {appid}")
            return

        response = requests.get(self.api_url_template.format(game=game))
        if response.status_code != 200:
            logging.error(f"Failed to fetch data from API for game: {game}")
            return

        api_items = response.json()
        item_data_map = {item['markethashname']: item for item in api_items}

        for item in items:
            market_hash_name = item[0]
            if market_hash_name in item_data_map:
                api_item = item_data_map[market_hash_name]
                quality = api_item.get('quality')
                rarity = api_item.get('rarity')
                itemgroup = api_item.get('itemgroup')
                self.update_item(market_hash_name, quality, rarity, itemgroup, conn)

        conn.close()

    def update_item(self, market_hash_name, quality, rarity, itemgroup, conn):
        cursor = conn.cursor()
        try:
            cursor.execute('''
            UPDATE steam_items
            SET quality = %s, rarity = %s, itemgroup = %s
            WHERE market_hash_name = %s
            ''', (quality, rarity, itemgroup, market_hash_name))
            conn.commit()
            logging.info(f"Successfully updated item: {market_hash_name}")
        except Exception as e:
            conn.rollback()
            logging.error(f"Error updating item {market_hash_name}: {e}")
        finally:
            cursor.close()
