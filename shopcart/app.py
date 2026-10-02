
import json
import sqlite3
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / 'shopcart.db'


def connect_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def setup_database():
    # Prices are whole rupees in this small demo.
    with connect_db() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY, name TEXT, category TEXT,
            price INTEGER, icon TEXT, description TEXT)''')
        db.execute('''CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT,
            address TEXT, total INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)''')
        db.execute('''CREATE TABLE IF NOT EXISTS order_items (
            order_id INTEGER, product_name TEXT, price INTEGER, quantity INTEGER)''')
        if db.execute('SELECT COUNT(*) FROM products').fetchone()[0] == 0:
            products = [
                ('Wireless Headphones', 'Electronics', 1499, '🎧', 'Over-ear headphones for music and everyday listening. Demo product.'),
                ('Everyday Backpack', 'Accessories', 899, '🎒', 'A lightweight bag with space for books and daily essentials.'),
                ('Desk Lamp', 'Home', 649, '💡', 'A compact reading lamp for your study table.'),
                ('Running Shoes', 'Fashion', 1299, '👟', 'Casual shoes for everyday walks. Demo size: UK 8.'),
                ('Coffee Mug', 'Home', 249, '☕', 'A simple ceramic mug for your morning drink.'),
                ('Python Notebook', 'Stationery', 199, '📓', 'A ruled notebook for coding notes and practice.'),
                ('Wireless Mouse', 'Electronics', 499, '🖱️', 'A compact mouse for your laptop or desktop.'),
                ('Water Bottle', 'Accessories', 399, '🧴', 'A reusable bottle for college, work and travel.')
            ]
            db.executemany('INSERT INTO products (name,category,price,icon,description) VALUES (?,?,?,?,?)', products)


def place_order(data):
    customer = data.get('customer', '')
    address = data.get('address', '')
    items = data.get('items', [])
    if not isinstance(customer, str) or not 2 <= len(customer.strip()) <= 80:
        raise ValueError('Enter a name between 2 and 80 characters.')
    if not isinstance(address, str) or not 10 <= len(address.strip()) <= 300:
        raise ValueError('Enter an address between 10 and 300 characters.')
    if not isinstance(items, list) or not 1 <= len(items) <= 20:
        raise ValueError('Your cart must contain 1 to 20 different products.')
    checked_items = []
    seen = set()
    total = 0
    with connect_db() as db:
        for item in items:
            if not isinstance(item, dict):
                raise ValueError('Invalid cart item.')
            product_id = item.get('id')
            quantity = item.get('quantity')
            if type(product_id) is not int or type(quantity) is not int or not 1 <= quantity <= 10:
                raise ValueError('Quantity must be a whole number from 1 to 10.')
            if product_id in seen:
                raise ValueError('Duplicate product in cart.')
            seen.add(product_id)
            product = db.execute('SELECT * FROM products WHERE id=?', (product_id,)).fetchone()
            if product is None:
                raise ValueError('Product not found.')
            # Always calculate totals from database prices, not browser prices.
            total += product['price'] * quantity
            checked_items.append((product['name'], product['price'], quantity))
        cursor = db.execute('INSERT INTO orders (customer,address,total) VALUES (?,?,?)',
                            (customer.strip(), address.strip(), total))
        order_id = cursor.lastrowid
        db.executemany('INSERT INTO order_items VALUES (?,?,?,?)',
                       [(order_id, name, price, qty) for name, price, qty in checked_items])
    return {'order_id': order_id, 'total': total}


class ShopHandler(BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/products':
            with connect_db() as db:
                products = [dict(row) for row in db.execute('SELECT * FROM products')]
            self.send_json(products)
            return
        # Only these files can be served. The database is never public.
        pages = {
            '/': ('templates/index.html', 'text/html'),
            '/cart': ('templates/cart.html', 'text/html'),
            '/orders': ('templates/orders.html', 'text/html'),
            '/static/style.css': ('static/style.css', 'text/css'),
            '/static/script.js': ('static/script.js', 'text/javascript')
        }
        if path not in pages:
            self.send_error(404)
            return
        filename, content_type = pages[path]
        body = (BASE_DIR / filename).read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', content_type + '; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if urlparse(self.path).path != '/api/orders':
            self.send_error(404)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 20000:
                raise ValueError('Invalid request size.')
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError('Invalid order data.')
            self.send_json(place_order(data), 201)
        except (ValueError, UnicodeDecodeError) as error:
            self.send_json({'error': str(error)}, 400)
        except sqlite3.Error:
            self.send_json({'error': 'Could not save the order. Please try again.'}, 500)


if __name__ == '__main__':
    setup_database()
    server = HTTPServer(('127.0.0.1', 8000), ShopHandler)
    print('ShopCart is running at http://127.0.0.1:8000')
    print('Press Ctrl+C to stop. This is a local demo, not a production store.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShopCart stopped.')
    finally:
        server.server_close()
