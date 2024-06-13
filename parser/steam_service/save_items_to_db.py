import logging
from database import get_db_connection

def save_items_to_db(items):
    conn = get_db_connection()
    cursor = conn.cursor()
    logging.info("Saving items to database...")

    market_hash_names = [item['asset_description'].get('market_hash_name', '') for item in items]

    cursor.execute('''
    SELECT market_hash_name FROM steam_items WHERE market_hash_name = ANY(%s)
    ''', (market_hash_names,))
    existing_items = set(row[0] for row in cursor.fetchall())

    new_items = [item for item in items if item['asset_description'].get('market_hash_name', '') not in existing_items]

    if not new_items:
        logging.info("No new items to save.")
        cursor.close()
        conn.close()
        return

    insert_data = []
    for item in new_items:
        asset_description = item.get('asset_description', {})
        tradable = bool(asset_description.get('tradable', 0))
        market_hash_name = asset_description.get('market_hash_name', '')
        market_tradable_restriction = asset_description.get('market_tradable_restriction', 0)
        marketable = bool(asset_description.get('marketable', 0))
        commodity = bool(asset_description.get('commodity', 0))
        appid = asset_description.get('appid', None)

        insert_data.append((
            item['name'], item['hash_name'], item.get('sell_listings', 0),
            item.get('sell_price', 0), item.get('sell_price_text', ''),
            item.get('app_icon', ''), item.get('app_name', ''),
            tradable, item.get('name', ''), market_hash_name,
            commodity, market_tradable_restriction, 0,
            marketable, asset_description.get('type', ''),
            asset_description.get('background_color', ''),
            asset_description.get('icon_url', ''), asset_description.get('icon_url_large', ''),
            appid
        ))

    try:
        cursor.executemany('''
        INSERT INTO steam_items (
            name, hash_name, sell_listings, sell_price, sell_price_text,
            app_icon, app_name, tradable, market_name, market_hash_name,
            commodity, market_tradable_restriction, market_marketable_restriction,
            marketable, type, background_color, icon_url, icon_url_large, appid
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (hash_name) DO UPDATE SET
            sell_listings = EXCLUDED.sell_listings,
            sell_price = EXCLUDED.sell_price,
            sell_price_text = EXCLUDED.sell_price_text,
            app_icon = EXCLUDED.app_icon,
            app_name = EXCLUDED.app_name,
            tradable = EXCLUDED.tradable,
            market_name = EXCLUDED.market_name,
            market_hash_name = EXCLUDED.market_hash_name,
            commodity = EXCLUDED.commodity,
            market_tradable_restriction = EXCLUDED.market_tradable_restriction,
            market_marketable_restriction = EXCLUDED.market_marketable_restriction,
            marketable = EXCLUDED.marketable,
            type = EXCLUDED.type,
            background_color = EXCLUDED.background_color,
            icon_url = EXCLUDED.icon_url,
            icon_url_large = EXCLUDED.icon_url_large,
            appid = EXCLUDED.appid
        ''', insert_data)
        conn.commit()
        logging.info(f"Successfully saved or updated {len(insert_data)} items.")
    except Exception as e:
        conn.rollback()
        logging.error(f"Error saving items: {e}")
    finally:
        cursor.close()
        conn.close()

    logging.info("Items saved to database.")
