# ShopCart — beginner e-commerce demo

A small Amazon-inspired shopping layout with its own name and design.
Built using **Python, HTML, CSS, JavaScript and SQLite**. No pip packages,
frameworks, Node.js, API keys or internet connection are needed to run it.
Product art uses emoji, so its appearance varies by device.

## Run on Windows

1. Install Python 3 if needed. Open the extracted `shopcart` folder in VS Code.
2. Open Terminal > New Terminal. Make sure the terminal is in the folder containing `app.py`.
3. Run:

```bash
python app.py
```

If Windows does not recognize `python`, try `py app.py`.
4. Open **http://127.0.0.1:8000** in your browser.
5. Stop the server with **Ctrl+C**.

Do not double-click the HTML files: the Python server provides the API.
If port 8000 is already in use, stop the previous server first.

## Folder structure

- `app.py`: Python server, product data, SQLite tables and order validation.
- `templates/index.html`: product catalog, filters and product details dialog.
- `templates/cart.html`: shopping cart and demo checkout form.
- `templates/orders.html`: this browser's demo order history.
- `static/style.css`: layout, colors and mobile styles.
- `static/script.js`: search, sorting, wishlist, cart and API requests.
- `.gitignore`: excludes generated database and Python cache from GitHub.
- `LEARN.md`: code walkthrough and practice tasks.
- `shopcart.db`: created automatically on first run; not included in the download.

There is no `model.py`, `model.pkl` or CSV training dataset: this project does
not use machine learning. Python's built-in `sqlite3` manages the database.
There is no `requirements.txt` because there are no external dependencies.

## Implemented features

- Eight seeded sample products with category, price, description and emoji art.
- Product-name search, category filter, price sorting and product details.
- Wishlist and cart stored in browser localStorage.
- Add/remove cart items; quantities from 1 to 10; automatic totals.
- Demo checkout with name/address validation.
- Server reads prices from SQLite, recalculates totals and saves order items.
- Order confirmation/history in the current browser; responsive page layouts.

## Data flow

1. JavaScript requests `GET /api/products` from Python.
2. Python reads SQLite products and returns JSON.
3. JavaScript renders cards. Cart and wishlist stay in browser storage.
4. Checkout sends product IDs, quantities, name and address to `POST /api/orders`.
5. Python validates inputs and saves the order and items in one transaction.
6. The browser saves a local receipt and shows the orders page.

Order history on screen comes from localStorage, not a database history API.
Clearing browser storage removes that visible history, but SQLite order rows
remain. No login or cross-device account synchronization is implemented.
Use sample names and addresses. A demo order does not charge money or ship goods.

## Test manually

1. Search for `mouse`: one product should appear. Try an unknown name: empty state.
2. Filter Electronics and sort low-to-high: mouse should precede headphones.
3. Save a product to the wishlist; turn on Wishlist only; refresh.
4. Add two products to cart. Change quantity and remove one; verify the total.
5. Try empty checkout fields; the browser should prevent submission.
6. Place a demo order with a sample address; see the receipt and empty cart.
7. Refresh the order history page; the receipt should remain in the same browser.
8. Resize the browser to a phone width and check the catalog and cart.

## Upload to GitHub

Create an empty repository, then upload the **contents of the shopcart folder**,
keeping `templates` and `static` as folders. Do not upload the ZIP itself as
source, `shopcart.db`, or `__pycache__`. GitHub Pages cannot run this Python backend;
GitHub can store the source, but opening the repository is not a live demo.

## Scope

Local learning prototype only. The standard-library HTTP server is not a
production ecommerce server. No real payments, stock control, shipping,
authentication, actual customer reviews, or admin panel. A successful demo order
means saved locally, not paid or fulfilled. Do not use for real customers.
Repeated checkout submissions create separate orders; payment-grade retry
handling is outside this beginner version.

The code is intentionally straightforward for learning. Read it, make changes,
and describe your own contributions honestly in interviews.
