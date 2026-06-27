const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// متغير لتخزين حالة الطلب
let pendingOrder = 0;

// هذا المسار للـ ESP32 (ليعرف أن هناك طلب)
app.get('/update', (req, res) => {
  if (pendingOrder > 0) {
    res.send('order=1');
    pendingOrder = 0; // إعادة تعيين بعد إرسال الإشارة
  } else {
    res.send('no_order');
  }
});

// هذا المسار لصفحة المطعم (الواجهة التي يراها الزبون)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مطعم فلك</title>
        <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .btn { padding: 20px 40px; font-size: 20px; background: #2ecc71; color: white; border-radius: 10px; text-decoration: none; display: inline-block; }
        </style>
    </head>
    <body>
        <h1>أهلاً بك في مطعم فلك</h1>
        <p>اضغط لتأكيد طلبك</p>
        <a href="/add-order" class="btn">تأكيد الطلب 📲</a>
    </body>
    </html>
  `);
});

// المسار عند ضغط الزبون على تأكيد الطلب
app.get('/add-order', (req, res) => {
  pendingOrder = 1; // تفعيل الطلب
  res.send('<h1>تم إرسال طلبك! سيضيء الجهاز الآن.</h1><a href="/">عودة للمنيو</a>');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
