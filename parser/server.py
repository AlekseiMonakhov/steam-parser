from flask import Flask
from controller import get_steam_items
from proxy import fetch_proxies_from_2ip

app = Flask(__name__)

@app.route('/items/<int:appid>')
def items(appid):
    return get_steam_items(appid)

@app.route('/proxy')
def proxy():
    return fetch_proxies_from_2ip()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
