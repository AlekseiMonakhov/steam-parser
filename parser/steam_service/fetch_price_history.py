import logging
import requests
import time
from database import get_db_connection
from config import Config

def fetch_price_history(appid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, market_hash_name FROM steam_items WHERE market_hash_name IS NOT NULL AND appid = %s", (appid,))
    items = cursor.fetchall()
    logging.info(f"Fetched {len(items)} items with valid market_hash_name from database.")

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

    batch_size = 20
    items_processed = 0

    delay = 12
    max_retries = 3

    for item_id, market_hash_name in items:
        for attempt in range(max_retries):
            url = f"http://steamcommunity.com/market/pricehistory/?country=KZ&language=english&currency=37&appid={appid}&market_hash_name={market_hash_name}"

            time.sleep(delay)

            response = session.get(url)
            logging.info(f"URL: {url}")
            logging.info(f"Response Status Code: {response.status_code}")

            if response.status_code == 429:
                logging.warning(f"Rate limit exceeded. Increasing delay and retrying. Attempt {attempt + 1}/{max_retries}")
                delay *= 2
                continue

            try:
                data = response.json()
            except ValueError:
                logging.error("Failed to decode JSON from response")
                break  

            if isinstance(data, dict) and data.get('success', True):
                for entry in data['prices']:
                    date, price, volume = entry
                    formatted_date = date[:-4] + date[-2:]
                    cursor.execute('''
                    INSERT INTO price_history (item_id, date, price, volume)
                    SELECT %s, TO_TIMESTAMP(%s, 'Mon DD YYYY HH24'), %s, %s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM price_history WHERE item_id = %s AND date = TO_TIMESTAMP(%s, 'Mon DD YYYY HH24')
                    )
                    ''', (item_id, formatted_date, price, volume, item_id, formatted_date))
            else:
                logging.error(f"Failed to fetch or parse price history for item {item_id}. Response: {data}")

            break  

        items_processed += 1

        if items_processed % batch_size == 0:
            conn.commit()
            logging.info(f"Committed batch of {batch_size} items.")

    conn.commit()
    cursor.close()
    conn.close()
    logging.info("Completed updating price history.")