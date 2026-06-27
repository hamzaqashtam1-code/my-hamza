const express = require('express');
const app = express();
const cors = require('cors');
const fetch = require('node-fetch');
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- هنا ضع رابط سيرفر الإدارة بعد أن ترفعه على Render ---
const DASHBOARD_URL = "https://qmc-admin-panel.onrender.com"; 

let systemConfig = { restaurantName: "مطاعم أبو يونس", bgImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", themeColor: "#1e4620", availableTables: 12 };
let categories = ["الكل"];
let mealsData = [];
let hasOrder = false;

// دالة لجلب البيانات من سيرفر الإدارة
async function syncWithDashboard() {
    try {
        const response = await fetch(`${DASHBOARD_URL}/api/public/menu`);
        const data = await response.json();
        systemConfig = data.systemConfig;
        categories = ["الكل", ...data.categories.map(c => c.name)];
        mealsData = data.mealsData;
    } catch (e) { console.log("بانتظار سيرفر الإدارة..."); }
}
setInterval(syncWithDashboard, 10000);
syncWithDashboard();

// كود الأردوينو
app.get('/update', (req, res) => {
    if (hasOrder) { res.send('order=1'); hasOrder = false; }
    else { res.send('no_order'); }
});

// إرسال الطلب للإدارة
app.post('/api/submit-order', async (req, res) => {
    hasOrder = true;
    try {
        await fetch(`${DASHBOARD_URL}/api/public/submit-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// واجهة الزبائن
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${systemConfig.restaurantName}</title>
    <style>
        :root { --primary-color: ${systemConfig.themeColor}; }
        body { font-family: 'Segoe UI', sans-serif; background: #f4f6f8; margin: 0; }
        .header { height: 180px; background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${systemConfig.bgImage}'); background-size: cover; display: flex; justify-content: center; align-items: center; color: white; }
        .meal-card { background: white; border-radius: 15px; margin: 15px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; }
        .meal-img { width: 100%; height: 150px; object-fit: cover; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="header"><h1>${systemConfig.restaurantName}</h1></div>
    <div id="menu"></div>
    <script>
        const meals = ${JSON.stringify(mealsData)};
        document.getElementById('menu').innerHTML = meals.map(m => '<div class="meal-card"><img src="'+m.img+'" class="meal-img"><h3>'+m.name+'</h3><p>'+m.price+' دينار</p></div>').join('');
    </script>
</body>
</html>
    `);
});

app.listen(port, () => console.log('Client Server Running'));
