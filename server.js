const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// إعداد السيرفر لقراءة البيانات المرسلة من لوحة التحكم
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// متغيرات النظام المركزية (تتغير ديناميكياً من لوحة الإدارة)
let systemConfig = {
    restaurantName: "مطاعم أبو يونس",
    bgImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    themeColor: "#1e4620", // اللون الأخضر الخنّاني الفخم الافتراضي
    availableTables: 12
};

let hasOrder = false;
let ordersList = []; // مصفوفة لتخزين الطلبات الحية وعرضها للمدير

// 1. مسار الـ ESP32 الخاص بالمطبخ لفحص الإشارة
app.get('/update', (req, res) => {
    if (hasOrder) {
        res.send('order=1');
        hasOrder = false;
    } else {
        res.send('no_order');
    }
});

// 2. مسار استقبال الطلب وحفظه في النظام وتفعيل الـ ESP32
app.post('/api/submit-order', (req, res) => {
    const { table, items, notes, total } = req.body;
    
    // إضافة الطلب إلى قائمة الإدارة
    ordersList.unshift({
        id: ordersList.length + 1,
        table,
        items,
        notes,
        total,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });

    hasOrder = true; // تفعيل جرس المطبخ
    res.json({ success: true });
});

// 3. مسار لوحة تحكم الإدارة السرية (لتحديث الإعدادات ورؤية الطلبات)
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة إدارة مطاعم أبو يونس</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 20px; color: #333; }
        .admin-container { max-width: 800px; margin: auto; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        h2, h3 { color: ${systemConfig.themeColor}; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .form-group { margin-bottom: 15px; text-align: right; }
        label { display: block; font-weight: bold; margin-bottom: 5px; }
        input[type="text"], input[type="number"], input[type="color"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
        input[type="color"] { height: 45px; padding: 2px; cursor: pointer; }
        button { background: ${systemConfig.themeColor}; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; }
        .order-card { background: #f9f9f9; padding: 15px; border-right: 5px solid ${systemConfig.themeColor}; margin-bottom: 10px; border-radius: 4px; }
    </style>
</head>
<body>
<div class="admin-container">
    <h2>⚙️ لوحة التحكم والإدارة الفخمة</h2>
    <form action="/admin/update-settings" method="POST">
        <div class="form-group">
            <label>اسم المطعم:</label>
            <input type="text" name="restaurantName" value="${systemConfig.restaurantName}">
        </div>
        <div class="form-group">
            <label>رابط صورة الخلفية (الهيدر):</label>
            <input type="text" name="bgImage" value="${systemConfig.bgImage}">
        </div>
        <div class="form-group">
            <label>لون الهوية والمطعم (حالياً أخضر خنّاني):</label>
            <input type="color" name="themeColor" value="${systemConfig.themeColor}">
        </div>
        <div class="form-group">
            <label>عدد الطاولات المتوفرة بالنظام:</label>
            <input type="number" name="availableTables" value="${systemConfig.availableTables}">
        </div>
        <button type="submit">حفظ وتطبيق الإعدادات فوراً 💾</button>
    </form>

    <h3>📥 الطلبات الحية الحالية (${ordersList.length})</h3>
    <div id="ordersContainer">
        ${ordersList.map(o => `
            <div class="order-card">
                <b>طاولة رقم: ${o.table}</b> <span style="float:left; color:#7f8c8d;">${o.time}</span><br>
                <small>الطلبات: ${o.items}</small><br>
                <small>الملاحظات: ${o.notes || 'لا يوجد'}</small><br>
                <span style="color:${systemConfig.themeColor}; font-weight:bold;">الإجمالي: ${o.total} دينار</span>
            </div>
        `).join('')}
    </div>
</div>
</body>
</html>
    `);
});

// مسار استقبال تحديثات الإعدادات من المدير
app.post('/admin/update-settings', (req, res) => {
    const { restaurantName, bgImage, themeColor, availableTables } = req.body;
    systemConfig.restaurantName = restaurantName;
    systemConfig.bgImage = bgImage;
    systemConfig.themeColor = themeColor;
    systemConfig.availableTables = parseInt(availableTables) || 12;
    res.redirect('/admin'); // إعادة توجيه لصفحة المدير بعد الحفظ
});

// 4. صفحة المنيو الرئيسية للزبائن (متناسقة ديناميكياً مع اختيارات المدير)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${systemConfig.restaurantName}</title>
    <style>
        :root { --primary-color: ${systemConfig.themeColor}; --bg-light: #f4f6f8; --dark-blue: #2c3e50; }
        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg-light); margin: 0; padding-bottom: 80px; }
        .page-wrapper { max-width: 500px; margin: auto; background: white; min-height: 100vh; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; }
        .header { position: relative; height: 180px; background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${systemConfig.bgImage}'); background-size: cover; background-position: center; display: flex; justify-content: center; align-items: center; color: white; }
        .header h1 { font-size: 28px; text-shadow: 2px 2px 4px rgba(0,0,0,0.6); margin: 0; }
        .filter-bar { display: flex; gap: 10px; padding: 15px; overflow-x: auto; background: white; border-bottom: 1px solid #eee; }
        .filter-btn { padding: 8px 15px; border-radius: 20px; border: 1px solid var(--primary-color); background: white; color: var(--primary-color); white-space: nowrap; font-weight: bold; }
        .filter-btn.active { background: var(--primary-color); color: white; }
        .menu-container { padding: 15px; }
        .meal-card { display: flex; align-items: center; background: #fff; border-bottom: 1px solid #eee; padding: 15px 0; }
        .meal-img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; margin-left: 15px; }
        .floating-cart { position: fixed; bottom: 25px; right: 25px; background: var(--primary-color); color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 100; }
        #cartCount { position: absolute; top: -5px; right: -5px; background: var(--dark-blue); color: white; font-size: 12px; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; }
        
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: flex-end; z-index: 1000; }
        .modal-content { background: white; width: 100%; max-width: 500px; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 20px; max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
        button { cursor: pointer; border: none; padding: 8px 12px; border-radius: 5px; }

        .table-selector-wrapper { margin: 15px 0; text-align: right; }
        .table-selector-wrapper label { font-weight: bold; color: var(--dark-blue); display: block; margin-bottom: 8px; }
        .table-select { width: 100%; padding: 12px; border-radius: 10px; border: 2px solid #ddd; font-size: 16px; font-weight: bold; color: var(--dark-blue); background: #f9f9f9; outline: none; }
        
        /* واجهة النجاح المخصصة باللون الأخضر الخنّاني الملكي */
        .success-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: none; justify-content: center; align-items: center; z-index: 2000; animation: fadeIn 0.3s ease; }
        .success-card { background: var(--primary-color); width: 85%; max-width: 380px; border-radius: 25px; padding: 30px 20px; text-align: center; box-shadow: 0 15px 30px rgba(0,0,0,0.3); transform: scale(0.7); transition: transform 0.3s ease; color: white; }
        .success-overlay.show { display: flex; }
        .success-overlay.show .success-card { transform: scale(1); }
        .success-icon { width: 70px; height: 70px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 35px; margin: 0 auto 20px; font-weight: bold; }
        .success-title { font-size: 24px; font-weight: bold; margin-bottom: 12px; }
        .success-msg { font-size: 16px; margin-bottom: 25px; line-height: 1.5; opacity: 0.95; }
        .success-thanks { font-size: 13px; border-top: 1px dashed rgba(255,255,255,0.4); padding-top: 15px; font-style: italic; opacity: 0.85; }
        .close-success-btn { background: white; color: var(--primary-color); border-radius: 10px; padding: 12px 25px; font-weight: bold; font-size: 16px; margin-top: 20px; width: 100%; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>
<body>

<div id="successModal" class="success-overlay">
    <div class="success-card">
        <div class="success-icon">✓</div>
        <div class="success-title">تم الطلب بنجاح</div>
        <div id="successDetails" class="success-msg"></div>
        <div class="success-thanks">شكراً لاختياركم مطاعم أبو يونس، وصحتين وعافية على قلبكم! ✨</div>
        <button class="close-success-btn" onclick="closeSuccessModal()">رائع</button>
    </div>
</div>

<div class="page-wrapper">
    <header class="header"><h1>${systemConfig.restaurantName}</h1></header>
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
        <div style="font-weight:bold; margin-bottom:15px; font-size: 18px; color: var(--dark-blue);">سلة الطلبات <span onclick="closeCartModal()" style="float:left; cursor:pointer; color: #aaa;">✕</span></div>
        <div id="cartItemsList"></div>
        
        <div class="table-selector-wrapper">
            <label for="tableNumberSelect">الرجاء اختيار رقم الطاولة:</label>
            <select id="tableNumberSelect" class="table-select"></select>
        </div>

        <div style="border-top:2px solid #eee; margin:15px 0; padding-top:10px; font-weight:bold; font-size:18px; color: var(--dark-blue);">
            الإجمالي: <span id="cartTotal">0.00</span> دينار
        </div>
        <textarea id="orderNotes" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; box-sizing: border-box;" placeholder="ملاحظات.."></textarea>
        <button onclick="submitOrder()" style="width:100%; padding:15px; background:var(--primary-color); color:white; border-radius:8px; margin-top:15px; font-weight:bold; font-size: 16px;">تأكيد الطلب 📲</button>
    </div>
</div>

<script>
    const maxTables = ${systemConfig.availableTables};

    const mealsData = [
        { id: 1, name: "شاورما دجاج", price: 3.50, category: "شاورما", img: "https://images.unsplash.com/photo-1649144368140-5e3692beeb51?w=200" },
        { id: 2, name: "بروستد كامل", price: 6.00, category: "بروستد", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200" },
        { id: 3, name: "بيبسي", price: 0.50, category: "مشروبات", img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200" }
    ];
    let cart = {};
    let currentCategory = 'الكل';

    const tableSelect = document.getElementById('tableNumberSelect');
    for(let i = 1; i <= maxTables; i++) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerText = "طاولة رقم " + i;
        tableSelect.appendChild(opt);
    }

    function filterMenu(cat, btn) { currentCategory = cat; document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderMenu(); }
    
    function renderMenu() {
        const container = document.getElementById('menuItemsContainer');
        const filtered = currentCategory === 'الكل' ? mealsData : mealsData.filter(m => m.category === currentCategory);
        container.innerHTML = filtered.map(m => \`
            <div class="meal-card">
                <img src="\${m.img}" class="meal-img">
                <div style="flex:1;"><b>\${m.name}</b><br><span style="color: var(--primary-color); font-weight:bold;">\${m.price.toFixed(2)} دينار</span></div>
                <div style="display:flex; align-items:center; gap:8px; margin-left: 10px;">
                    <button onclick="changeQty(\${m.id}, -1)" style="background:#eee; font-weight:bold; width:30px; height:30px; border-radius:50%;">-</button>
                    <span style="font-weight:bold; width:20px; text-align:center;">\${cart[m.id] || 0}</span>
                    <button onclick="changeQty(\${m.id}, 1)" style="background:var(--primary-color); color:white; font-weight:bold; width:30px; height:30px; border-radius:50%;">+</button>
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
        list.innerHTML = Object.keys(cart).length === 0 ? "<div style='color:#7f8c8d; text-align:center; padding:20px;'>السلة فارغة</div>" : "";
        for(let id in cart) { 
            let m = mealsData.find(x => x.id == id); 
            list.innerHTML += \`<div style="display:flex; justify-content:between; margin-bottom:10px; font-size:15px;">
                <div style="flex:1;">• \${m.name} <span style="color:#7f8c8d;">(x\${cart[id]})</span></div>
                <div style="font-weight:bold;">\${(m.price * cart[id]).toFixed(2)} دينار</div>
            </div>\`; 
        }
    }
    
    function closeCartModal() { document.getElementById('cartModal').style.display = 'none'; }
    
    function submitOrder() { 
        if(Object.keys(cart).length === 0) return;
        const chosenTable = document.getElementById('tableNumberSelect').value;
        const notes = document.getElementById('orderNotes').value;
        
        let itemsSummary = Object.keys(cart).map(id => {
            let m = mealsData.find(x => x.id == id);
            return m.name + " (" + cart[id] + ")";
        }).join(', ');

        // إرسال الطلب للسيرفر لتخزينه في قائمة المدير وتشغيل الجرس
        fetch('/api/submit-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table: chosenTable,
                items: itemsSummary,
                notes: notes,
                total: document.getElementById('cartTotal').innerText
            })
        });
        
        // تعديل محتوى واجهة النجاح حسب طلبك الدقيق
        document.getElementById('successDetails').innerText = "تم ارسال طلبك الخاص بطاولة رقم (" + chosenTable + ")";
        
        closeCartModal();
        document.getElementById('successModal').classList.add('show');
        
        cart={}; 
        document.getElementById('orderNotes').value = "";
        updateUI(); 
    }

    function closeSuccessModal() { document.getElementById('successModal').classList.remove('show'); }
    renderMenu();
</script>
</body>
</html>
    `);
});

app.listen(port, () => console.log('Server running...'));
