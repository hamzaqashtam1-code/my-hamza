const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let hasOrder = false;

// مسار الـ ESP32
app.get('/update', (req, res) => {
    if (hasOrder) {
        res.send('order=1');
        hasOrder = false;
    } else {
        res.send('no_order');
    }
});

// مسار تفعيل الطلب
app.get('/trigger-order', (req, res) => {
    hasOrder = true;
    res.status(200).send('OK');
});

// صفحة المطعم (تصميمك بالكامل مع اسم مطاعم أبو يونس)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>مطاعم أبو يونس</title>
    <style>
        :root { --primary-color: #e74c3c; --bg-light: #f4f6f8; }
        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg-light); margin: 0; padding-bottom: 80px; }
        .page-wrapper { max-width: 500px; margin: auto; background: white; min-height: 100vh; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { position: relative; height: 180px; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'); background-size: cover; background-position: center; display: flex; justify-content: center; align-items: center; color: white; }
        .filter-bar { display: flex; gap: 10px; padding: 15px; overflow-x: auto; background: white; border-bottom: 1px solid #eee; }
        .filter-btn { padding: 8px 15px; border-radius: 20px; border: 1px solid var(--primary-color); background: white; color: var(--primary-color); white-space: nowrap; }
        .filter-btn.active { background: var(--primary-color); color: white; }
        .menu-container { padding: 15px; }
        .meal-card { display: flex; align-items: center; background: #fff; border-bottom: 1px solid #eee; padding: 15px 0; }
        .meal-img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; margin-left: 15px; }
        .floating-cart { position: fixed; bottom: 25px; right: 25px; background: var(--primary-color); color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4); z-index: 100; }
        #cartCount { position: absolute; top: -5px; right: -5px; background: #2c3e50; color: white; font-size: 12px; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: flex-end; z-index: 1000; }
        .modal-content { background: white; width: 100%; max-width: 500px; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 20px; max-height: 80vh; overflow-y: auto; }
        button { cursor: pointer; border: none; padding: 8px 12px; border-radius: 5px; }
    </style>
</head>
<body>
<div class="page-wrapper">
    <header class="header"><h1>مطاعم أبو يونس</h1></header>
    <div class="filter-bar" id="filterBar">
        <button class="filter-btn active" onclick="filterMenu('الكل', this)">الكل</button>
        <button class="filter-btn" onclick="filterMenu('شاورما', this)">شاورما</button>
        <button class="filter-btn" onclick="filterMenu('بروستد', this)">بروستد</button>
        <button class="filter-btn" onclick="filterMenu('مشروبات', this)">مشروبات</button>
    </div>
    <div id="menuItemsContainer" class="menu-container"></div>
    <div class="floating-cart" onclick="openCartModal()">
        <span id="cartCount">0</span>🛒
    </div>
</div>
<div class="modal" id="cartModal">
    <div class="modal-content">
        <div style="font-weight:bold; margin-bottom:15px;">سلة الطلبات <span onclick="closeCartModal()" style="float:left; cursor:pointer;">✕</span></div>
        <div id="cartItemsList"></div>
        <div style="border-top:2px solid #eee; margin:15px 0; padding-top:10px; font-weight:bold; font-size:18px;">
            الإجمالي: <span id="cartTotal">0.00</span> دينار
        </div>
        <textarea id="orderNotes" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;" placeholder="ملاحظات.."></textarea>
        <button onclick="submitOrder()" style="width:100%; padding:15px; background:#2ecc71; color:white; border-radius:8px; margin-top:15px; font-weight:bold;">تأكيد الطلب 📲</button>
    </div>
</div>
<script>
    const mealsData = [
        { id: 1, name: "شاورما دجاج", price: 3.50, category: "شاورما", img: "https://images.unsplash.com/photo-1649144368140-5e3692beeb51?w=200" },
        { id: 2, name: "بروستد كامل", price: 6.00, category: "بروستد", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200" },
        { id: 3, name: "بيبسي", price: 0.50, category: "مشروبات", img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200" }
    ];
    let cart = {};
    let currentCategory = 'الكل';
    function filterMenu(cat, btn) { currentCategory = cat; document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderMenu(); }
    function renderMenu() {
        const container = document.getElementById('menuItemsContainer');
        const filtered = currentCategory === 'الكل' ? mealsData : mealsData.filter(m => m.category === currentCategory);
        container.innerHTML = filtered.map(m => \`
            <div class="meal-card">
                <img src="\${m.img}" class="meal-img">
                <div style="flex:1;"><b>\${m.name}</b><br>\${m.price.toFixed(2)} دينار</div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="changeQty(\${m.id}, -1)" style="background:#eee;">-</button>
                    <span style="font-weight:bold;">\${cart[m.id] || 0}</span>
                    <button onclick="changeQty(\${m.id}, 1)" style="background:#2ecc71; color:white;">+</button>
                </div>
            </div>\`).join('');
    }
    function changeQty(id, val) { cart[id] = (cart[id] || 0) + val; if(cart[id] <= 0) delete cart[id]; updateUI(); }
    function updateUI() {
        let count = 0, total = 0;
        for(let id in cart) { let m = mealsData.find(x => x.id == id); count += cart[id]; total += m.price * cart[id]; }
        document.getElementById('cartCount').innerText = count;
        document.getElementById('cartTotal').innerText = total.toFixed(2);
        renderMenu();
    }
    function openCartModal() {
        document.getElementById('cartModal').style.display = 'flex';
        let list = document.getElementById('cartItemsList');
        list.innerHTML = Object.keys(cart).length === 0 ? "السلة فارغة" : "";
        for(let id in cart) { let m = mealsData.find(x => x.id == id); list.innerHTML += \`<div>\${m.name} x \${cart[id]} = \${(m.price * cart[id]).toFixed(2)} دينار</div>\`; }
    }
    function closeCartModal() { document.getElementById('cartModal').style.display = 'none'; }
    function submitOrder() { 
        fetch('/trigger-order'); 
        alert('تم الطلب!'); 
        cart={}; 
        updateUI(); 
        closeCartModal(); 
    }
    renderMenu();
</script>
</body>
</html>
    `);
});

app.listen(port, () => console.log('Server running...'));
