const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let pendingOrder = 0; // هذا المتغير سيخبر الـ ESP32 بوجود طلب

// 1. هذا المسار الذي يتصل به الـ ESP32 كل 5 ثواني
app.get('/update', (req, res) => {
    if (pendingOrder === 1) {
        res.send('order=1');
        pendingOrder = 0; // إعادة تعيين الحالة بعد استلام الطلب
    } else {
        res.send('no_order');
    }
});

// 2. هذا المسار الذي يتم استدعاؤه عند ضغط "تأكيد الطلب"
app.get('/trigger-order', (req, res) => {
    pendingOrder = 1;
    res.status(200).send('OK');
});

// 3. صفحة المنيو (تصميمك الاحترافي)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>مطعم فلك</title>
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
            </style>
        </head>
        <body>
            <div class="page-wrapper">
                <header class="header"><h1>مطعم فلك</h1></header>
                <div id="menuItemsContainer" class="menu-container"></div>
                <div class="floating-cart" onclick="openCartModal()"><span id="cartCount">0</span>🛒</div>
            </div>
            <div class="modal" id="cartModal">
                <div class="modal-content">
                    <button onclick="submitOrder()" style="width:100%; padding:15px; background:#2ecc71; color:white; border-radius:8px; font-weight:bold;">تأكيد الطلب 📲</button>
                </div>
            </div>
            <script>
                // ... (نفس السكريبت الخاص بك مع تعديل بسيط في دالة submitOrder)
                function submitOrder() { 
                    fetch('/trigger-order'); // هذا السطر يخبر السيرفر بوجود طلب
                    alert('تم إرسال طلبك للمطبخ!'); 
                    closeCartModal(); 
                }
                // ... (بقية السكريبت)
            </script>
        </body>
        </html>
    `);
});

app.listen(port, () => console.log('Server running...'));
