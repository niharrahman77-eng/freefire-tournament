// pages/api/create-order.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, userId, username, email } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum amount is ₹10' });
    }

    const orderId = `order_${userId}_${Date.now()}`;

    const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_name: username || 'Player',
          customer_email: email || 'player@ffarena.com',
          customer_phone: '9999999999',
        },
      }),
    });

    const data = await response.json();

    if (!data.payment_session_id) {
      console.error('Cashfree error:', data);
      return res.status(500).json({ error: 'Failed to create order', details: data });
    }

    return res.status(200).json({
      orderId: data.order_id,
      sessionId: data.payment_session_id,
    });

  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: err.message });
  }
}
