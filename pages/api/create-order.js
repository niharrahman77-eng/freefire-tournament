// pages/api/create-order.js
// This runs on the SERVER - your Razorpay secret key is safe here

import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount } = req.body;

  if (!amount || amount < 10) {
    return res.status(400).json({ error: 'Minimum amount is ₹10' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    res.status(200).json(order);
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
