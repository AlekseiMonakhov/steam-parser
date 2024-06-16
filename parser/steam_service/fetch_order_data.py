import re
import logging
import requests
from database import get_db_connection
from config import Config
from datetime import datetime

def fetch_order_data(appid):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Добавляем колонку date, если ее нет
    cursor.execute("""
    ALTER TABLE item_orders
    ADD COLUMN IF NOT EXISTS date DATE;
    """)

    conn.commit()

    cursor.execute("SELECT id, item_nameid FROM steam_items WHERE item_nameid IS NOT NULL")
    items = cursor.fetchall()
    logging.info(f"Fetched {len(items)} items with valid item_nameid from database.")

    session = requests.Session()
    session.cookies.set('steamLoginSecure', Config.STEAM_LOGIN_SECURE)
    session.cookies.set('sessionid', Config.STEAM_SESSIONID)
    session.cookies.set('browserid', Config.STEAM_BROWSERID)
    session.cookies.set('steamCountry', Config.STEAM_COUNTRY)

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
            # Текущая дата
            today = datetime.utcnow().date()

            # Проверяем наличие записей за текущий день
            cursor.execute('''
            SELECT 1 FROM item_orders WHERE item_id = %s AND date = %s
            ''', (item_id, today))

            if cursor.fetchone():
                logging.info(f"Orders for item {item_id} already exist for today. Skipping insertion.")
                continue

            # Обработка sell_order_graph
            for order in data.get('sell_order_graph', []):
                try:
                    price = float(order[0])
                    quantity = int(order[1])
                    cursor.execute('''
                    INSERT INTO item_orders (item_id, order_type, price, quantity, date)
                    VALUES (%s, %s, %s, %s, %s)
                    ''', (item_id, 'sell', price, quantity, today))
                    logging.info(f"Sell order saved for item {item_id}: price {price}, quantity {quantity}")
                except ValueError as e:
                    logging.error(f"Failed to parse sell order for item {item_id}: {e}")
                    continue

            # Обработка buy_order_graph
            for order in data.get('buy_order_graph', []):
                try:
                    price = float(order[0])
                    quantity = int(order[1])
                    cursor.execute('''
                    INSERT INTO item_orders (item_id, order_type, price, quantity, date)
                    VALUES (%s, %s, %s, %s, %s)
                    ''', (item_id, 'buy', price, quantity, today))
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
