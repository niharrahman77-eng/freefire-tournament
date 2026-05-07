import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
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

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    amount,
    username,
  } = req.body;

  try {
    // Step 1: Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Step 2: Check not already processed
    const existing = await adminDb
      .collection('transactions')
      .where('razorpayPaymentId', '==', razorpay_payment_id)
      .get();

    if (!existing.empty) {
      return res.status(200).json({ success: true });
    }

    // Step 3: Add coins to wallet
    await adminDb.collection('users').doc(userId).update({
      balance: FieldValue.increment(amount),
    });

    // Step 4: Save transaction
    await adminDb.collection('transactions').add({
      userId,
      username,
      type: 'credit',
      amount,
      description: `Added ₹${amount} via Razorpay`,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      createdAt: new Date(),
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}