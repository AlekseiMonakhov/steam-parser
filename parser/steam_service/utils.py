import logging

def load_proxies():
    try:
        with open('proxies.txt', 'r') as f:
            proxies = [line.strip() for line in f if line.strip()]
            logging.info("Proxies loaded.")
            return proxies
    except FileNotFoundError:
        logging.warning("Proxy file not found.")
        return []
