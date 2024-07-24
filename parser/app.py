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
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
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

@app.route('/items/<int:appid>')
def items(appid):
    run_service(appid)
    return jsonify({"status": "Completed processing items"}), 200

def schedule_tasks():
    scheduler = BackgroundScheduler()

    for appid in APP_IDS:
        scheduler.add_job(run_service, args=[appid], trigger=DateTrigger(run_date=datetime.datetime.now()))
        scheduler.add_job(run_service, args=[appid], trigger=IntervalTrigger(hours=12))

    for appid in APP_IDS:
        scheduler.add_job(ItemNameIdParser().fetch_item_nameids, args=[appid], trigger=DateTrigger(run_date=datetime.datetime.now() + datetime.timedelta(seconds=10)))

    scheduler.add_job(ItemRarityQualityItemgroupParser().fetch_and_update_items, args=[730, 'csgo'], trigger=DateTrigger(run_date=datetime.datetime.now()))
    scheduler.add_job(ItemRarityQualityItemgroupParser().fetch_and_update_items, args=[730, 'csgo'], trigger=IntervalTrigger(hours=12))
    scheduler.add_job(ItemRarityQualityItemgroupParser().fetch_and_update_items, args=[570, 'dota'], trigger=DateTrigger(run_date=datetime.datetime.now()))
    scheduler.add_job(ItemRarityQualityItemgroupParser().fetch_and_update_items, args=[570, 'dota'], trigger=IntervalTrigger(hours=12))

    scheduler.add_job(fetch_order_data, args=[730], trigger=DateTrigger(run_date=datetime.datetime.now()))
    scheduler.add_job(fetch_order_data, args=[730], trigger=IntervalTrigger(hours=12))

    scheduler.add_job(fetch_order_data, args=[570], trigger=DateTrigger(run_date=datetime.datetime.now() + datetime.timedelta(hours=1)))
    scheduler.add_job(fetch_order_data, args=[570], trigger=IntervalTrigger(hours=12, start_date=datetime.datetime.now() + datetime.timedelta(hours=1)))

    scheduler.add_job(fetch_order_data, args=[578080], trigger=DateTrigger(run_date=datetime.datetime.now() + datetime.timedelta(hours=2)))
    scheduler.add_job(fetch_order_data, args=[578080], trigger=IntervalTrigger(hours=12, start_date=datetime.datetime.now() + datetime.timedelta(hours=2)))

    for appid in APP_IDS:
        scheduler.add_job(fetch_price_history, args=[appid], trigger=DateTrigger(run_date=datetime.datetime.now()))
        scheduler.add_job(fetch_price_history, args=[appid], trigger=IntervalTrigger(hours=6))

    scheduler.start()

if __name__ == "__main__":
    schedule_tasks()
    app.run(host='0.0.0.0', port=5000)
