// pages/api/verify-payment.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, userId, amount, username } = req.body;

  try {
    // Verify order status with Cashfree
    const response = await fetch(`https://sandbox.cashfree.com/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    const data = await response.json();

    // Check payment is actually paid
    if (data.order_status !== 'PAID') {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }

    // Check not already processed
    const existing = await adminDb
      .collection('transactions')
      .where('cashfreeOrderId', '==', orderId)
      .get();

    if (!existing.empty) {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    // Add coins to wallet
    await adminDb.collection('users').doc(userId).update({
      balance: FieldValue.increment(amount),
    });

    // Save transaction
    await adminDb.collection('transactions').add({
      userId,
      username,
      type: 'credit',
      amount,
      description: `Added ₹${amount} via Cashfree`,
      cashfreeOrderId: orderId,
      createdAt: new Date(),
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
