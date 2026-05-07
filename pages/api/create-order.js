import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum amount is ₹10' });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    return res.status(200).json(order);

  } catch (err) {
    console.error('Create order error:', err);
    return res.status(500).json({ error: err.message });
  }
}