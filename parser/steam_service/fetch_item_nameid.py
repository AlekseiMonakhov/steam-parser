import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from database import get_db_connection

def init_driver(proxy=None):
    options = Options()
    options.add_argument('--headless')  
    return webdriver.Chrome(options=options)

def fetch_item_nameid(name, appid):
    logging.info(f"Fetching item_nameid for item: {name}")
    driver = init_driver()
    url = f'https://steamcommunity.com/market/listings/{appid}/{name}'
    driver.get(url)
    
    try:
        html_content = driver.page_source
        start_index = html_content.find("ItemActivityTicker.Start(")
        if start_index != -1:
            start_index += len("ItemActivityTicker.Start(")
            end_index = html_content.find(")", start_index)
            item_nameid = html_content[start_index:end_index].strip()
            logging.info(f"item_nameid for {name}: {item_nameid}")
            update_item_nameid(name, item_nameid)
        else:
            logging.error(f"item_nameid for {name} not found")
    finally:
        driver.quit()

def update_item_nameid(name, item_nameid):
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
