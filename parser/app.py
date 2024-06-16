import logging
from flask import Flask, jsonify
from dotenv import load_dotenv
from steam_service.steam_item_service import SteamItemService
from config import Config
from apscheduler.schedulers.background import BackgroundScheduler

logging.basicConfig(level=logging.INFO)

load_dotenv()

app = Flask(__name__)

APP_IDS = [730, 570, 578780]

def run_service(appid):
    service = SteamItemService(Config.API_KEY, appid)
    service.run()

@app.route('/items/<int:appid>')
def items(appid):
    run_service(appid)
    return jsonify({"status": "Completed processing items"}), 200

@app.route('/fetch-nameid/<int:appid>')
def fetch_nameid(appid):
    parser = ItemNameIdParser()
    parser.fetch_item_nameids(appid)
    return jsonify({"status": "Completed processing name IDs"}), 200

def scheduled_tasks():
    for appid in APP_IDS:
        run_service(appid)

if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    scheduler.add_job(scheduled_tasks, 'interval', hours=2)
    scheduler.start()

    scheduled_tasks()

    app.run(host='0.0.0.0', port=5000)
