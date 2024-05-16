import logging
from flask import Flask, jsonify
from dotenv import load_dotenv
from steam_service.steam_item_service import SteamItemService
from config import Config

logging.basicConfig(level=logging.INFO)

load_dotenv()

app = Flask(__name__)

@app.route('/items/<int:appid>')
def items(appid):
    service = SteamItemService(Config.API_KEY, appid)
    service.run()
    return jsonify({"status": "Completed processing items"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
