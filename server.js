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
    { id: 1, name: "شاورما دجاج", price: 3.50, category: "شاورما", description: "شاورما على الفحم مع الثومية والبطاطس المقرمشة", img: "https://images.unsplash.com/photo-1649144368140-5e3692beeb51?w=200" },
    { id: 2, name: "بروستد كامل", price: 6.00, category: "بروستد", description: "4 قطع دجاج بروستد مقرمش مع البطاطا، الثومية، والخبز", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200" },
    { id: 3, name: "بيبسي", price: 0.50, category: "مشروبات", description: "عبوة باردة ومنعشة", img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200" }
];

let hasOrder = false;
let ordersList = [];

// جرس الـ ESP32
app.get('/update', (req, res) => {
    if (hasOrder) { 
        res.send('order=1'); 
        hasOrder = false; 
    } else { 
        res.send('no_order'); 
    }
});

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

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>\${systemConfig.restaurantName}</title>
    <style>
        :root { 
            --primary-color: \${systemConfig.themeColor}; 
            --bg-light: #f4f6f8; 
            --dark-blue: #2c3e50; 
        }
        body { 
            font-family: 'Segoe UI', sans-serif; 
            background-color: var(--bg-light); 
            margin: 0; 
            padding-bottom: 80px; 
        }
        .page-wrapper { 
            max-width: 500px; 
            margin: auto; 
            background: white; 
            min-height: 100vh; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
            position: relative; 
        }
        .header { 
            position: relative; 
            height: 180px; 
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('\${systemConfig.bgImage}'); 
            background-size: cover; 
            background-position: center; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            color: white; 
        }
        .header h1 { 
            font-size: 28px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.6); 
            margin: 0; 
        }
        .filter-bar { 
            display: flex; 
            gap: 10px; 
            padding: 15px; 
            overflow-x: auto; 
            background: white; 
            border-bottom: 1px solid #eee; 
        }
        .filter-btn { 
            padding: 8px 15px; 
            border-radius: 20px; 
            border: 1px solid var(--primary-color); 
            background: white; 
            color: var(--primary-color); 
            white-space: nowrap; 
            font-weight: bold; 
            cursor: pointer;
        }
        .filter-btn.active { 
            background: var(--primary-color); 
            color: white; 
        }
        .menu-container { 
            padding: 15px; 
        }
        .meal-card { 
            background: #fff; 
            border-radius: 15px; 
            overflow: hidden; 
            margin-bottom: 20px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
            border: 1px solid #f0f0f0; 
            text-align: center; 
            padding-bottom: 15px; 
        }
        .meal-img { 
            width: 100%; 
            height: 200px; 
            object-fit: cover; 
        }
        .meal-name { 
            font-size: 19px; 
            font-weight: bold; 
            color: var(--dark-blue); 
            margin: 12px 10px 5px 10px; 
        }
        .meal-desc { 
            font-size: 13px; 
            color: #7f8c8d; 
            margin: 0 15px 12px 15px; 
            line-height: 1.4; 
            min-height: 36px; 
        }
        .meal-price { 
            font-size: 18px; 
            font-weight: bold; 
            color: var(--primary-color); 
            margin-bottom: 12px; 
        }
        .qty-controls { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            gap: 15px; 
        }
        .qty-btn { 
            background: var(--primary-color); 
            color: white; 
            border: none; 
            font-weight: bold; 
            width: 36px; 
            height: 36px; 
            border-radius: 50%; 
            font-size: 18px; 
            cursor: pointer; 
        }
        .qty-btn.minus { 
            background: #e2e8f0; 
            color: #333; 
        }
        .floating-cart { 
            position: fixed;
