import logging
from flask import Flask, jsonify
from dotenv import load_dotenv
from steam_service.steam_item_service import SteamItemService
from steam_service.fetch_item_nameid import ItemNameIdParser
from steam_service.fetch_rarity_quality_itemgroup import ItemRarityQualityItemgroupParser
from steam_service.fetch_order_data import fetch_order_data
from steam_service.fetch_price_history import fetch_price_history
from steam_service.save_items_to_db import save_items_to_db
from config import Config
from apscheduler.schedulers.background import BackgroundScheduler
import datetime

logging.basicConfig(level=logging.INFO)

load_dotenv()

app = Flask(__name__)

APP_IDS = [730, 570, 578080]

def run_service(appid):
    service = SteamItemService(Config.API_KEY, appid)
    items = service.get_steam_items()
    if items:
        save_items_to_db(items)

def schedule_tasks():
    scheduler = BackgroundScheduler()

    for appid in APP_IDS:
        run_service(appid)

        ItemRarityQualityItemgroupParser().fetch_and_update_items(appid, 'csgo' if appid == 730 else 'dota')

        scheduler.add_job(ItemNameIdParser().fetch_item_nameids, args=[appid], id=f'fetch_nameid_{appid}', max_instances=1, misfire_grace_time=60)
        scheduler.add_job(fetch_order_data, args=[appid], id=f'fetch_order_{appid}', max_instances=1, misfire_grace_time=60)
        scheduler.add_job(fetch_price_history, args=[appid], id=f'fetch_price_{appid}', max_instances=1, misfire_grace_time=60)

    scheduler.start()

if __name__ == "__main__":
    schedule_tasks()
    app.run(host='0.0.0.0', port=5000)