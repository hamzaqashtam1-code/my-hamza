const express = require('express');
const app = express();
const cors = require('cors'); 
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let systemConfig = {
    restaurantName: "مطاعم أبو يونس",
    bgImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    themeColor: "#1e4620", 
    availableTables: 12
};

let categories = ["الكل", "شاورما", "بروستد", "مشروبات"];
let mealsData = [
    { id: 1, name: "شاورما دجاج", price: 3.50, category: "شاورما", description: "شاورما على الفحم مع الثومية والبطاطس المقرمشة", img: "https://images.unsplash.com/photo-1649144368140-5e3692beeb51?w=200", available: true },
    { id: 2, name: "بروستد كامل", price: 6.00, category: "بروستد", description: "4 قطع دجاج بروستد مقرمش مع البطاطا، الثومية، والخبز", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200", available: true },
    { id: 3, name: "بيبسي", price: 0.50, category: "مشروبات", description: "عبوة باردة ومنعشة", img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200", available: true }
];

let hasOrder = false;
let ordersList = [];

// مسار قطعة الـ ESP32
app.get('/update', (req, res) => {
    if (hasOrder) { 
        res.send('order=1'); 
        hasOrder = false; 
    } else { 
        res.send('no_order'); 
    }
});

// APIs التحكم
app.get('/api/get-system', (req, res) => {
    res.json({ systemConfig, categories, mealsData, ordersList });
});

app.post('/api/update-config', (req, res) => {
    systemConfig = req.body;
    res.json({ success: true, systemConfig });
});

app.post('/api/update-meals', (req, res) => {
    mealsData = req.body.mealsData;
    res.json({ success: true, mealsData });
});

app.post('/api/toggle-meal-status', (req, res) => {
    const { mealId, available } = req.body;
    const meal = mealsData.find(m => m.id === parseInt(mealId));
    if (meal) {
        meal.available = available;
        res.json({ success: true, mealsData });
    } else {
        res.status(404).json({ success: false, message: "الوجبة غير موجودة" });
    }
});

app.post('/api/submit-order', (req, res) => {
    const { table, items, notes, total, rawItems } = req.body;
    ordersList.unshift({
        id: ordersList.length + 1,
        table, items, rawItems, notes,
        total: parseFloat(total) || 0,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
    hasOrder = true; 
    res.json({ success: true });
});

// 1. صفحة الزبائن الرئيسية
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>\${systemConfig.restaurantName}</title>
    <style>
        :root { --primary-color: \${systemConfig.themeColor}; --bg-light: #f4f6f8; --dark-blue: #2c3e50; }
        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg-light); margin: 0; padding-bottom: 80px; }
        .page-wrapper { max-width: 500px; margin: auto; background: white; min-height: 100vh; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; }
        .header { position: relative; height: 180px; background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('\${systemConfig.bgImage}'); background-size: cover; background-position: center; display: flex; justify-content: center; align-items: center; color: white; }
        .header h1 { font-size: 28px; text-shadow: 2px 2px 4px rgba(0,0,0,0.6); margin: 0; }
        .filter-bar { display: flex; gap: 10px; padding: 15px; overflow-x: auto; background: white; border-bottom: 1px solid #eee; }
        .filter-btn { padding: 8px 15px; border-radius: 20px; border: 1px solid var(--primary-color); background: white; color: var(--primary-color); white-space: nowrap; font-weight: bold; cursor: pointer; }
        .filter-btn.active { background: var(--primary-color); color: white; }
        .menu-container { padding: 15px; }
        .meal-card { background: #fff; border-radius: 15px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; text-align: center; padding-bottom: 15px; }
        .meal-img { width: 100%; height: 200px; object-fit: cover; }
        .meal-name { font-size: 19px; font-weight: bold; color: var(--dark-blue); margin: 12px 10px 5px 10px; }
        .meal-desc { font-size: 13px; color: #7f8c8d; margin: 0 15px 12px 15px; line-height: 1.4; min-height: 36px; }
        .meal-price { font-size: 18px; font-weight: bold; color: var(--primary-color); margin-bottom: 12px; }
        .qty-controls { display: flex; justify-content: center; align-items: center; gap: 15px; }
        .qty-btn { background: var(--primary-color); color: white; border: none; font-weight: bold; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; }
        .qty-btn.minus { background: #e2e8f0; color: #333; }
        .floating-cart { position: fixed; bottom: 25px; right: 25px; background: var(--primary-color); color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.15); z-index: 100; }
        #cartCount { position: absolute; top: -5px; right: -5px; background: var(--dark-blue); color: white; font-size: 12px; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; }
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: flex-end; z-index: 1000; }
        .modal-content { background: white; width: 100%; max-width: 500px; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 20px; max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
        .table-selector-wrapper { margin: 15px 0; text-align: right; }
        .table-selector-wrapper label { font-weight: bold; color: var(--dark-blue); display: block; margin-bottom: 8px; }
        .table-select { width: 100%; padding: 12px; border-radius: 10px; border: 2px solid #ddd; font-size: 16px; font-weight: bold; color: var(--dark-blue); background: #f9f9f9; outline: none; }
        .success-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: none; justify-content: center; align-items: center; z-index: 2000; }
        .success-card { background: var(--primary-color); width: 85%; max-width: 380px; border-radius: 25px; padding: 30px 20px; text-align: center; color: white; }
        .success-overlay.show { display: flex; }
        .success-icon { width: 70px; height: 70px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 35px; margin: 0 auto 20px; font-weight: bold; }
        .close-success-btn { background: white; color: var(--primary-color); border-radius: 10px; padding: 12px 25px; font-weight: bold; font-size: 16px; margin-top: 20px; width: 100%; border: none; cursor: pointer; }
    </style>
</head>
<body>
<div id="successModal" class="success-overlay">
    <div class="success-card">
        <div class="success-icon">✓</div>
        <div style="font-size:24px; font-weight:bold; margin-bottom:12px;">تم الطلب بنجاح</div>
        <div id="successDetails" style="font-size:16px; margin-bottom:25px;"></div>
        <button class="close-success-btn" onclick="closeSuccessModal()">رائع</button>
    </div>
</div>
<div class="page-wrapper">
    <header class="header"><h1>\${systemConfig.restaurantName}</h1></header>
    <div class="filter-bar" id="filterBar">
        <button class="filter-btn active" onclick="filterMenu('الكل', this)">الكل</button>
        \${categories.filter(c => c !== "الكل").map(c => \`<button class="filter-btn" onclick="filterMenu('\${c}', this)">\${c}</button>\`).join('')}
    </div>
    <div id="menuItemsContainer" class="menu-container"></div>
    <div class="floating-cart" onclick="openCartModal()"><span id="cartCount">0</span>🛒</div>
</div>
<div class="modal" id="cartModal">
    <div class="modal-content">
        <div style="font-weight:bold; margin-bottom:15px; font-size:18px;">سلة الطلبات <span onclick="closeCartModal()" style="float:left; cursor:pointer; color:#aaa;">✕</span></div>
        <div id="cartItemsList"></div>
        <div class="table-selector-wrapper"><label>رقم الطاولة:</label><select id="tableNumberSelect" class="table-select"></select></div>
        <div style="border-top:2px solid #eee; margin:15px 0; padding-top:10px; font-weight:bold; font-size:18px;">الإجمالي: <span id="cartTotal">0.00</span> دينار</div>
        <textarea id="orderNotes" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing: border-box;" placeholder="أي ملاحظات؟"></textarea>
        <button onclick="submitOrder()" style="width:100%; padding:15px; background:var(--primary-color); color:white; border-radius:8px; margin-top:15px; font-weight:bold; border:none; cursor:pointer;">تأكيد الطلب 📲</button>
    </div>
</div>
<script>
    const maxTables = \${systemConfig.availableTables};
    let mealsData = \${JSON.stringify(mealsData)};
    let cart = {}; let currentCategory = 'الكل';
    const tableSelect = document.getElementById('tableNumberSelect');
    for(let i = 1; i <= maxTables; i++) { let opt = document.createElement('option'); opt.value = i; opt.innerText = "طاولة رقم " + i; tableSelect.appendChild(opt); }
    function filterMenu(cat, btn) { currentCategory = cat; document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderMenu(); }
    function renderMenu() {
        const container = document.getElementById('menuItemsContainer');
        const filtered = currentCategory === 'الكل' ? mealsData.filter(m => m.available !== false) : mealsData.filter(m => m.category === currentCategory && m.available !== false);
        if(filtered.length === 0) { container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد وجبات متاحة حالياً.</div>'; return; }
        container.innerHTML = filtered.map(m => \`
            <div class="meal-card">
                <img src="\${m.img}" class="meal-img">
                <div class="meal-name">\${m.name}</div>
                <div class="meal-desc">\${m.description}</div>
                <div class="meal-price">\${m.price.toFixed(2)} دينار</div>
                <div class="qty-controls">
                    <button onclick="changeQty(\${m.id}, -1)" class="qty-btn minus">-</button>
                    <span style="font-weight:bold; width: 20px; text-align:center;">\${cart[m.id] || 0}</span>
                    <button onclick="changeQty(\${m.id}, 1)" class="qty-btn">+</button>
                </div>
            </div>\`).join('');
    }
    function changeQty(id, val) { cart[id] = (cart[id] || 0) + val; if(cart[id] <= 0) delete cart[id]; updateUI(); }
    function updateUI() { let count = 0, total = 0; for(let id in cart) { let m = mealsData.find(x => x.id == id); if(m) { count += cart[id]; total += m.price * cart[id]; } } document.getElementById('cartCount').innerText = count; document.getElementById('cartTotal').innerText = total.toFixed(2); renderMenu(); }
    function openCartModal() { document.getElementById('cartModal').style.display = 'flex'; let list = document.getElementById('cartItemsList'); list.innerHTML = Object.keys(cart).length === 0 ? "السلة فارغة" : ""; for(let id in cart) { let m = mealsData.find(x => x.id == id); if(m) list.innerHTML += '<div>• ' + m.name + ' (x' + cart[id] + ')</div>'; } }
    function closeCartModal() { document.getElementById('cartModal').style.display = 'none'; }
    function submitOrder() {
        if(Object.keys(cart).length === 0) return;
        const chosenTable = document.getElementById('tableNumberSelect').value;
        const notes = document.getElementById('orderNotes').value;
        let itemsSummary = Object.keys(cart).map(id => mealsData.find(x => x.id == id).name + " (" + cart[id] + ")").join(', ');
        fetch('/api/submit-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: chosenTable, items: itemsSummary, rawItems: cart, notes: notes, total: document.getElementById('cartTotal').innerText }) })
        .then(() => { document.getElementById('successDetails').innerText = "تم إرسال طلب طاولة " + chosenTable; closeCartModal(); document.getElementById('successModal').classList.add('show'); cart={}; updateUI(); });
    }
    function closeSuccessModal() { document.getElementById('successModal').classList.remove('show'); window.location.reload(); }
    renderMenu();
</script>
</body>
</html>
    `);
});

// 2. لوحة التحكم الاحترافية مدمجة داخل السيرفر لمنع خطأ الـ CORS نهائياً
app.get('/dashboard', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة إدارة مطاعم أبو يونس - QMC</title>
    <style>
        :root { --primary-color: #1e4620; --secondary-color: #2c3e50; --success-color: #2ecc71; --bg-light: #f5f7fa; }
        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg-light); margin: 0; padding: 20px; }
        .container { max-width: 1100px; margin: 0 auto; }
        header { background: linear-gradient(135deg, var(--primary-color), #2d6a31); color: white; padding: 20px; border-radius: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
        .card { background: white; border-radius: 15px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .card-title { font-size: 18px; font-weight: bold; color: var(--secondary-color); margin-bottom: 20px; border-left: 4px solid var(--primary-color); padding-left: 10px; display: flex; justify-content: space-between; }
        .order-box { background: #fff; border-right: 5px solid var(--primary-color); border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .meal-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f2f5; }
        .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--success-color); }
        input:checked + .slider:before { transform: translateX(24px); }
        .no-data { text-align: center; color: #999; padding: 20px 0; }
    </style>
</head>
<body>
<div class="container">
    <header>
        <div><h1>لوحة إدارة مطاعم أبو يونس 👑</h1><div style="font-size: 13px; margin-top: 5px;">منظومة QMC Automation</div></div>
        <div style="background:rgba(255,255,255,0.2); padding:8px 15px; border-radius:20px; font-weight:bold;" id="syncStatus">● متصل لايف</div>
    </header>
    <div class="card">
        <div class="card-title">الطلبات الحية بالمطبخ 🛎️ <span id="orderCount" style="background:var(--primary-color); color:white; padding:2px 10px; border-radius:12px; font-size:14px;">0 طلب</span></div>
        <div id="liveOrdersContainer"><div class="no-data">جاري تحميل الطلبات...</div></div>
    </div>
    <div class="card">
        <div class="card-title">التحكم بالأصناف (إيقاف/تشغيل) 🚫</div>
        <div id="mealsControlContainer"><div class="no-data">جاري تحميل الوجبات...</div></div>
    </div>
</div>
<script>
    function fetchData() {
        fetch('/api/get-system')
            .then(res => res.json())
            .then(data => { renderOrders(data.ordersList); renderMealsControl(data.mealsData); })
            .catch(() => { document.getElementById('syncStatus').innerText = "○ خطأ اتصال"; });
    }
    function renderOrders(orders) {
        const container = document.getElementById('liveOrdersContainer');
        document.getElementById('orderCount').innerText = orders.length + " طلب";
        if(!orders || orders.length === 0) { container.innerHTML = '<div class="no-data">لا توجد طلبات حالياً ✨</div>'; return; }
        container.innerHTML = orders.map(o => \`
            <div class="order-box">
                <div style="display:flex; justify-content:between; font-weight:bold;"><span>طاولة [ \${o.table} ]</span> <span style="margin-right:auto; color:var(--primary-color)">\${o.total} دينار</span></div>
                <div style="margin:8px 0; color:#555;">\${o.items}</div>
                \${o.notes ? \`<div style="background:#fff8db; padding:5px; border-radius:4px; font-size:13px;">💬 \${o.notes}</div>\` : ''}
            </div>\`).join('');
    }
    function renderMealsControl(meals) {
        const container = document.getElementById('mealsControlContainer');
        container.innerHTML = meals.map(m => \`
            <div class="meal-item">
                <div><strong>\${m.name}</strong> <br> <span style="font-size:12px; color:#777;">\${m.price.toFixed(2)} دينار | \${m.category}</span></div>
                <label class="switch">
                    <input type="checkbox" \${m.available !== false ? 'checked' : ''} onchange="toggleMeal(\${m.id}, this.checked)">
                    <span class="slider"></span>
                </label>
            </div>\`).join('');
    }
    function toggleMeal(id, isAvailable) {
        fetch('/api/toggle-meal-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mealId: id, available: isAvailable }) });
    }
    fetchData(); setInterval(fetchData, 4000);
</script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Unified Server running on port ${port}`));
