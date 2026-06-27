const express = require('express');
const app = express();
app.use(express.json());
let pendingOrders = [];
app.post('/order', (req, res) => { pendingOrders.push(req.body); res.status(200).send("OK"); });
app.get('/get-order', (req, res) => {
    if (pendingOrders.length > 0) res.json(pendingOrders.shift());
    else res.status(204).send();
});
app.listen(process.env.PORT || 3000);
