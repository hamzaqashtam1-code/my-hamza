const express = require('express');
const app = express();
const cors = require('cors');
const fetch = require('node-fetch'); // تأكد من تثبيت هذه المكتبة: npm install node-fetch
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// رابط سيرفر الإدارة الذي ستحصل عليه بعد رفع السيرفر الآخر على Render
const DASHBOARD_URL = "https://qmc-admin-panel.onrender.com"; 

// متغيرات النظام المبدئية
let systemConfig = { restaurantName: "جاري التحميل...", bgImage: "", themeColor: "#1e4620", availableTables: 0 };
let categories = ["الكل"];
let mealsData = [];
let hasOrder = false;

// دالة جلب البيانات من سيرفر الإدارة (مزامنة دورية)
async function syncWithDashboard() {
    try {
        const response = await fetch(`${DASHBOARD_URL}/api/public/menu`);
        const data = await response.json();
        systemConfig = data.systemConfig;
        categories = ["الكل", ...data.categories.map(c => c.name)];
        mealsData = data.mealsData;
    } catch (e) {
        console.log("خطأ في الاتصال بسيرفر الإدارة، تأكد من الرابط.");
    }
}
setInterval(syncWithDashboard, 10000); // تحديث كل 10 ثواني
syncWithDashboard();

// الأردوينو لا يزال يعمل هنا
app.get('/update', (req, res) => {
    if (hasOrder) { res.send('order=1'); hasOrder = false; }
    else { res.send('no_order'); }
});

// إرسال الطلب لسيرفر الإدارة ليحفظه في سجل الجرد هناك
app.post('/api/submit-order', async (req, res) => {
    hasOrder = true;
    try {
        await fetch(`${DASHBOARD_URL}/api/public/submit-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: "فشل إرسال الطلب للسيرفر الرئيسي" });
    }
});

// صفحة الزبائن الرئيسية
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
        .header { height: 180px; background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${systemConfig.bgImage}'); background-size: cover; display: flex; justify-content: center; align-items: center; color: white; }
        .meal-card { background: #fff; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; padding-bottom: 15px; }
        .meal-img { width: 100%; height: 200px; object-fit: cover; }
        .meal-name { font-size: 19px; font-weight: bold; color: var(--dark-blue); margin: 10px; }
        .meal-price { font-size: 18px; font-weight: bold; color: var(--primary-color); }
        .qty-btn { background: var(--primary-color); color: white; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; }
    </style>
</head>
<body>
    <div class="header"><h1>${systemConfig.restaurantName}</h1></div>
    <div id="menuItemsContainer" style="padding:15px;"></div>
    
    <script>
        const mealsData = ${JSON.stringify(mealsData)};
        const maxTables = ${systemConfig.availableTables};
        // باقي كود الفرونت إيند كما هو (تم اختصاره هنا للتوضيح)..
        console.log("المنيو جاهز ويعمل ببيانات السيرفر المركزي");
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log(`Client Server running on port ${port}`));
