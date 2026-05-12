const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Order API is running" });
});

app.get("/orders", async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.id AS order_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total_amount,
        o.payment_method,
        o.order_status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    const [order] = await pool.query(
      `
      SELECT 
        o.id AS order_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total_amount,
        o.payment_method,
        o.order_status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
      `,
      [orderId],
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items] = await pool.query(
      `
      SELECT 
        od.id AS order_detail_id,
        p.name AS product_name,
        p.description,
        od.quantity,
        od.price,
        (od.quantity * od.price) AS subtotal
      FROM order_details od
      JOIN products p ON od.product_id = p.id
      WHERE od.order_id = ?
      `,
      [orderId],
    );

    res.json({
      order: order[0],
      items,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching order details",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
