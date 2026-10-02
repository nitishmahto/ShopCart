# Understand this project before adding it to your resume

## Start here

1. Open `templates/index.html`: identify the search box, product grid and dialog.
2. Read `static/style.css`: Grid creates product columns; Flexbox aligns controls.
3. Read `static/script.js`: begin with `start`, then `renderProducts`, `addToCart`,
   `renderCart` and `checkout`.
4. Read `app.py`: begin with `setup_database`, `do_GET`, `do_POST`, `place_order`.

## Main concepts in simple Hinglish

- **DOM:** JavaScript HTML elements banata/change karta hai. `textContent` text set karta hai.
- **Array:** Products/cart items ki list. `filter` matching items rakhta hai;
  `find` ek item dhundhta hai; `reduce` total calculate karta hai.
- **localStorage:** Browser mein text save hota hai. `JSON.stringify` array ko
  text banata hai; `JSON.parse` usko wapas array banata hai.
- **fetch:** Browser se Python server ko HTTP request bhejna.
- **GET:** Product data mangna. **POST:** Naya order bhejna.
- **SQLite:** Ek local file mein tables store karne wala database.
- **Parameterized SQL:** `?` placeholders se values separately pass karte hain.
- **Backend validation:** Browser data badla ja sakta hai, isliye Python price
  database se leta hai aur quantity dobara check karta hai.
- **Transaction:** Order aur uske items together save hote hain. Error aaye toh
  partial database change commit nahi hota.

## Practice changes

- Change the store name, colors and sample product descriptions.
- Add one sample product in `setup_database`. Seed data is added only when the
  products table is empty; use a new demo database to see seed changes.
- Add a maximum-price filter using the existing category filter as a reference.
- Explain the difference between wishlist, cart and saved orders.

## Questions you should be able to answer

- What happens when the user clicks Add to cart?
- Why does refreshing the page keep the cart?
- Why does checkout send product IDs instead of trusting prices from JavaScript?
- Which data is in SQLite and which data is only in the browser?
- What happens when the cart is empty or quantity exceeds 10?
- Can this site take real payments? (No.)

Avoid claiming that you independently wrote supplied code. Customize it and
understand the features you describe. The goal is a project you can explain.
