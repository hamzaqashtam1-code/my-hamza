const express = require('express');
const app = express();
const cors = require('cors'); 
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// الإعدادات المركزية الافتراضية وثبات الهوية الملكية الخضراء
let systemConfig = {
    restaurantName: "مطاعم أبو يونس",
    bgImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    themeColor: "#1e4620", 
    availableTables: 12
};

let categories = ["الكل", "شاورما", "بروستد", "مشروبات"];
let mealsData = [
    { id: 1, name: "شاورما دجاج", price: 3.50, category: "شاورما", description: "شاورما على الفحم مع الثومية والبطاطس المقرمشة", img: "https://images.unsplash.com/photo-1649144368140-5e3692beeb51?w=200" },
    { id: 2, name: "بروستد كامل", price: 6.00, category: "بروستد", description: "4 قطع دجاج بروستد مقرمش مع البطاطا، الثومية، والخبز", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200" },
    { id: 3, name: "بيبسي", price: 0.50, category: "مشروبات", description: "عبوة باردة ومنعشة", img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200" }
];

let hasOrder = false;
let ordersList = [];

// مسار قطعة الـ ESP32 لـ QMC بالمطبخ
app.get('/update', (req, res) => {
    if (hasOrder) { 
        res.send('order=1'); 
        hasOrder = false; 
    } else { 
        res.send('no_order'); 
    }
});

// APIs التحكم عن بعد
app.get('/api/get-system', (req, res) => {
    res.json({ systemConfig, categories, mealsData, ordersList });
});

app.post('/api/update-config', (req, res) => {
    systemConfig = req.body;
    res.json({ success: true });
});

app.post('/api/update-meals', (req, res) => {
    mealsData = req.body.mealsData;
    res.json({ success: true });
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

// صفحة الزبائن الرئيسية - معزولة كلياً ومحمية من أخطاء الـ Syntax
app.get('/', (req, res) => {
    const htmlPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${systemConfig.restaurantName}</title>
    <style>
        :root { 
            --primary-color: ${systemConfig.themeColor}; 
            --bg-light: #f4f6f8; 
            --dark-blue: #2c3e50; 
        }
        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg-light); margin: 0; padding-bottom: 80px; }
        .page-wrapper { max-width: 500px; margin: auto; background: white; min-height: 100vh; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; }
        .header { position: relative; height: 180px; background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${systemConfig.bgImage}'); background-size: cover; background-position: center; display: flex; justify-content: center; align-items: center; color: white; }
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
        <div style="font-size:13px; border-top:1px dashed rgba(255,255,255,0.4); padding-top:15px; font-style:italic;">شكراً لاختياركم مطاعم أبو يونس، وصحتين وعافية! ✨</div>
        <button class="close-success-btn" onclick="closeSuccessModal()">رائع</button>
    </div>
</div>

<div class="page-wrapper">
    <header class="header"><h1>${systemConfig.restaurantName}</h1></header>
    <div class="filter-bar" id="filterBar">
        <button class="filter-btn active" onclick="filterMenu('الكل', this)">الكل</button>
        ${categories.filter(c => c !== "الكل").map(c => `<button class="filter-btn" onclick="filterMenu('${c}', this)">${c}</button>`).join('')}
    </div>
    <div id="menuItemsContainer" class="menu-container"></div>
    <div class="floating-cart" onclick="openCartModal()">
        <span id="cartCount">0</span>🛒
    </div>
</div>

<div class="modal" id="cartModal">
    <div class="modal-content">
        <div style="font-weight:bold; margin-bottom:15px; font-size:18px;">سلة الطلبات <span onclick="closeCartModal()" style="float:left; cursor:pointer; color:#aaa;">✕</span></div>
        <div id="cartItemsList"></div>
        <div class="table-selector-wrapper">
            <label>رقم الطاولة:</label>
            <select id="tableNumberSelect" class="table-select"></select>
        </div>
        <div style="border-top:2px solid #eee; margin:15px 0; padding-top:10px; font-weight:bold; font-size:18px;">الإجمالي: <span id="cartTotal">0.00</span> دينار</div>
        <textarea id="orderNotes" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing: border-box;" placeholder="أي ملاحظات على الطلب؟ (مثال: بدون بصل، زيادة ثوم..)"></textarea>
        <button onclick="submitOrder()" style="width:100%; padding:15px; background:var(--primary-color); color:white; border-radius:8px; margin-top:15px; font-weight:bold; border:none; cursor:pointer;">تأكيد الطلب 📲</button>
    </div>
</div>

<script>
    const maxTables = ${systemConfig.availableTables};
    const mealsData = ${JSON.stringify(mealsData)};
    let cart = {}; 
    let currentCategory = 'الكل';
    
    const tableSelect = document.getElementById('tableNumberSelect');
    for(let i = 1; i <= maxTables; i++) {
        let opt = document.createElement('option'); 
        opt.value = i; 
        opt.innerText = "طاولة رقم " + i; 
        tableSelect.appendChild(opt);
    }
    
    function filterMenu(cat, btn) { 
        currentCategory = cat; 
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); 
        btn.classList.add('active'); 
        renderMenu(); 
    }
    
    function renderMenu() {
        const container = document.getElementById('menuItemsContainer');
        const filtered = currentCategory === 'الكل' ? mealsData : mealsData.filter(m => m.category === currentCategory);
        container.innerHTML = filtered.map(m => {
            return '<div class="meal-card">' +
                '<img src="' + m.img + '" class="meal-img">' +
                '<div class="meal-name">' + m.name + '</div>' +
                '<div class="meal-desc">' + m.description + '</div>' +
                '<div class="meal-price">' + m.price.toFixed(2) + ' دينار</div>' +
                '<div class="qty-controls">' +
                    '<button onclick="changeQty(' + m.id + ', -1)" class="qty-btn minus">-</button>' +
                    '<span style="font-weight:bold; width: 20px; text-align:center;">' + (cart[m.id] || 0) + '</span>' +
                    '<button onclick="changeQty(' + m.id + ', 1)" class="qty-btn">+</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    function changeQty(id, val) { 
        cart[id] = (cart[id] || 0) + val; 
        if(cart[id] <= 0) delete cart[id]; 
        updateUI(); 
    }
    
    function updateUI() {
        let count = 0, total = 0; 
        for(let id in cart) { 
            let m = mealsData.find(x => x.id == id); 
            count += cart[id]; 
            total += m.price * cart[id]; 
        }
        document.getElementById('cartCount').innerText = count; 
        document.getElementById('cartTotal').innerText = total.toFixed(2); 
        renderMenu();
    }
    
    function openCartModal() {
        document.getElementById('cartModal').style.display = 'flex';
        let list = document.getElementById('cartItemsList'); 
        list.innerHTML = Object.keys(cart).length === 0 ? "السلة فارغة، أضف بعض الوجبات الشهية أولاً!" : "";
        for(let id in cart) { 
            let m = mealsData.find(x => x.id == id); 
            list.innerHTML += '<div style="padding:8px 0; border-bottom:1px solid #f9f9f9;">• ' + m.name + ' (x' + cart[id] + ') - ' + (m.price * cart[id]).toFixed(2) + ' دينار</div>'; 
        }
    }
    
    function closeCartModal() { 
        document.getElementById('cartModal').style.display = 'none'; 
    }
    
    function submitOrder() {
        if(Object.keys(cart).length === 0) return;
        const chosenTable = document.getElementById('tableNumberSelect').value;
        const notes = document.getElementById('orderNotes').value;
        let itemsSummary = Object.keys(cart).map(id => mealsData.find(x => x.id == id).name + " (" + cart[id] + ")").join(', ');
        
        fetch('/api/submit-order', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                table: chosenTable, 
                items: itemsSummary, 
                rawItems: cart, 
                notes: notes, 
                total: document.getElementById('cartTotal').innerText 
            })
        }).then(() => {
            document.getElementById('successDetails').innerText = "تم إرسال طلبك الخاص بطاولة رقم (" + chosenTable + ") للمطبخ بنجاح.";
            closeCartModal(); 
            document.getElementById('successModal').classList.add('show'); 
            cart={}; 
            document.getElementById('orderNotes').value = "";
            updateUI();
        });
    }
    
    function closeSuccessModal() { 
        document.getElementById('successModal').classList.remove('show'); 
    }
    
    renderMenu();
</script>
</body>
</html>
    `;
    res.send(htmlPage);
});

app.listen(port, () => console.log(`Client Server running securely on port ${port}`));
