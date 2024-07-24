import logging
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from database import get_db_connection

class ItemNameIdParser:
    def __init__(self, proxy=None):
        self.proxy = proxy

    def init_driver(self):
        options = Options()
        options.add_argument('--headless')
        return webdriver.Chrome(options=options)

    def fetch_item_nameids(self, appid):
        logging.info(f"Fetching item_nameids for appid: {appid}")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        SELECT name FROM steam_items
        WHERE appid = %s AND item_nameid IS NULL
        ''', (appid,))
        items = cursor.fetchall()
        cursor.close()
        conn.close()

        if not items:
            logging.info(f"No items to update for appid: {appid}")
            return

        driver = self.init_driver()
        try:
            for item in items:
                name = item[0]
                url = f'https://steamcommunity.com/market/listings/{appid}/{name}'
                driver.get(url)

                try:
                    html_content = driver.page_source
                    item_nameid = self.extract_item_nameid(html_content)
                    if item_nameid:
                        logging.info(f"item_nameid for {name}: {item_nameid}")
                        self.update_item_nameid(name, item_nameid)
                    else:
                        logging.error(f"item_nameid for {name} not found")
                except Exception as e:
                    logging.error(f"Error fetching item_nameid for {name}: {e}")
                
                time.sleep(36)
        finally:
            driver.quit()

    def extract_item_nameid(self, html_content):
        start_marker_1 = "ItemActivityTicker.Start("
        start_index = html_content.find(start_marker_1)
        if start_index != -1:
            start_index += len(start_marker_1)
            end_index = html_content.find(")", start_index)
            if end_index != -1:
                item_nameid = html_content[start_index:end_index].strip()
                return item_nameid

        start_marker_2 = "Market_LoadOrderSpread("
        start_index = html_content.find(start_marker_2)
        if start_index != -1:
            start_index += len(start_marker_2)
            end_index = html_content.find(")", start_index)
            if end_index != -1:
                item_nameid = html_content[start_index:end_index].strip()
                return item_nameid

        return None

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