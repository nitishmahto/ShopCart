// Browser storage keeps this demo's cart, wishlist and order history.
function readStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : fallback;
    } catch { return fallback; }
}
let cart = readStorage('shopcart-cart', []).filter(item =>
    item && Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 10);
let wishlist = readStorage('shopcart-wishlist', []);
let products = [];
const money = value => '₹' + value.toLocaleString('en-IN');
const page = document.body.dataset.page;
let messageTimer;

function notify(text) {
    const box = document.getElementById('message');
    box.textContent = text;
    box.classList.add('visible');
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => box.classList.remove('visible'), 3500);
}
function saveStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { notify('Browser storage is unavailable. Changes may not survive a refresh.'); }
}
function updateCount() {
    document.getElementById('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}
function saveCart() {
    saveStorage('shopcart-cart', cart);
    updateCount();
}
function addToCart(id) {
    const item = cart.find(item => item.id === id);
    if (item && item.quantity >= 10) { notify('Maximum 10 of each product.'); return; }
    if (item) item.quantity++;
    else cart.push({id: id, quantity: 1});
    saveCart();
    notify('Added to cart');
}
// textContent avoids treating text as HTML.
function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function button(text, action, className = '') {
    const node = element('button', className, text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
}
function showDetails(product) {
    document.getElementById('detail-icon').textContent = product.icon;
    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-description').textContent = product.description;
    document.getElementById('detail-price').textContent = money(product.price);
    document.getElementById('detail-add').onclick = () => addToCart(product.id);
    document.getElementById('details').showModal();
}
function renderProducts() {
    const query = document.getElementById('search').value.trim().toLowerCase();
    const category = document.getElementById('category').value;
    const onlySaved = document.getElementById('wishlist-only').checked;
    let shown = products.filter(p => p.name.toLowerCase().includes(query)
        && (!category || p.category === category) && (!onlySaved || wishlist.includes(p.id)));
    const sort = document.getElementById('sort').value;
    if (sort === 'low') shown.sort((a, b) => a.price - b.price);
    if (sort === 'high') shown.sort((a, b) => b.price - a.price);
    document.getElementById('result-count').textContent = shown.length + ' products';
    const grid = document.getElementById('products');
    grid.replaceChildren();
    if (!shown.length) grid.append(element('p', 'empty', 'No matching products. Try another search or category.'));
    shown.forEach(product => {
        const card = element('article', 'product-card');
        const art = element('div', 'product-art', product.icon);
        art.setAttribute('aria-hidden', 'true');
        const saved = wishlist.includes(product.id);
        const heart = button(saved ? '♥' : '♡', () => {
            wishlist = saved ? wishlist.filter(id => id !== product.id) : [...wishlist, product.id];
            saveStorage('shopcart-wishlist', wishlist);
            renderProducts();
        }, 'heart');
        heart.setAttribute('aria-label', (saved ? 'Remove from wishlist: ' : 'Save to wishlist: ') + product.name);
        heart.setAttribute('aria-pressed', saved);
        const info = element('div', 'product-info');
        info.append(element('p', 'category', product.category), element('h3', '', product.name), element('p', 'price', money(product.price)));
        const actions = element('div', 'actions');
        actions.append(button('Details', () => showDetails(product), 'secondary'), button('Add to cart', () => addToCart(product.id)));
        info.append(actions);
        card.append(art, heart, info);
        grid.append(card);
    });
}
function renderCart() {
    const container = document.getElementById('cart-items');
    container.replaceChildren();
    let total = 0;
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        total += product.price * item.quantity;
        const row = element('article', 'cart-row');
        const info = element('div', 'cart-info');
        info.append(element('h3', '', product.name), element('p', '', money(product.price) + ' each'));
        const controls = element('div', 'quantity');
        const minus = button('−', () => changeQuantity(item.id, -1), 'secondary');
        minus.disabled = item.quantity <= 1;
        minus.setAttribute('aria-label', 'Decrease quantity: ' + product.name);
        const plus = button('+', () => changeQuantity(item.id, 1), 'secondary');
        plus.disabled = item.quantity >= 10;
        plus.setAttribute('aria-label', 'Increase quantity: ' + product.name);
        controls.append(minus, element('span', '', item.quantity), plus,
            button('Remove', () => { cart = cart.filter(i => i.id !== item.id); saveCart(); renderCart(); }, 'text-button'));
        info.append(controls);
        row.append(element('div', 'cart-icon', product.icon), info, element('strong', '', money(product.price * item.quantity)));
        container.append(row);
    });
    if (!cart.length) {
        const empty = element('div', 'empty', 'Your cart is empty. ');
        const link = element('a', '', 'Explore products'); link.href = '/'; empty.append(link); container.append(empty);
    }
    document.getElementById('cart-total').textContent = money(total);
    document.getElementById('place-order').disabled = !cart.length;
}
function changeQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    item.quantity = Math.max(1, Math.min(10, item.quantity + change));
    saveCart(); renderCart();
}
async function checkout(event) {
    event.preventDefault();
    const submit = document.getElementById('place-order');
    submit.disabled = true; submit.textContent = 'Placing order...';
    const form = new FormData(event.target);
    try {
        const response = await fetch('/api/orders', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({customer: form.get('customer'), address: form.get('address'), items: cart})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Order could not be saved.');
        const history = readStorage('shopcart-orders', []);
        history.unshift({id: data.order_id, total: data.total, date: new Date().toLocaleString(),
            items: cart.map(item => ({name: products.find(p => p.id === item.id).name, quantity: item.quantity}))});
        saveStorage('shopcart-orders', history);
        cart = []; saveCart();
        window.location.href = '/orders';
    } catch (error) {
        notify(error.message); submit.disabled = false; submit.textContent = 'Place demo order';
    }
}
function renderOrders() {
    const list = document.getElementById('order-list');
    const history = readStorage('shopcart-orders', []);
    if (!history.length) list.append(element('p', 'empty', 'No demo orders yet. Visit the shop to get started.'));
    history.forEach(order => {
        const card = element('article', 'order-card');
        card.append(element('span', 'badge', 'DEMO ORDER'), element('h2', '', 'Order #' + order.id), element('p', 'muted', order.date));
        (order.items || []).forEach(item => card.append(element('p', '', item.name + ' × ' + item.quantity)));
        card.append(element('strong', '', 'Total: ' + money(Number(order.total)))); list.append(card);
    });
}
async function start() {
    updateCount();
    if (page === 'orders') { renderOrders(); return; }
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Could not load products.');
        products = await response.json();
        cart = cart.filter(item => products.some(p => p.id === item.id)); saveCart();
        if (page === 'shop') {
            const select = document.getElementById('category');
            [...new Set(products.map(p => p.category))].forEach(category => {
                const option = element('option', '', category); option.value = category; select.append(option);
            });
            ['search', 'category', 'sort', 'wishlist-only'].forEach(id => document.getElementById(id).addEventListener('input', renderProducts));
            document.getElementById('close-details').onclick = () => document.getElementById('details').close();
            renderProducts();
        } else if (page === 'cart') {
            renderCart(); document.getElementById('checkout').addEventListener('submit', checkout);
        }
    } catch (error) {
        notify('Could not load products. Check that app.py is running, then refresh.');
        const target = document.getElementById(page === 'shop' ? 'products' : 'cart-items');
        target.textContent = 'Products unavailable. Please refresh after restarting the server.';
        const submit = document.getElementById('place-order'); if (submit) submit.disabled = true;
    }
}
start();
