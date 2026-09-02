const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

try {
  let serviceAccount;

  // 1. First, try to load from the Vercel Environment Variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // 2. If it's not set, fall back to the local file (for local development)
    const serviceAccountPath = path.resolve(__dirname, '../../../firebase-adminsdk.json');
    serviceAccount = require(serviceAccountPath);
  }
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully.');
  }
} catch (error) {
  console.warn('\n[!] Firebase Admin SDK warning: Could not find credentials.');
  console.warn('    Local: Place your firebase-adminsdk.json at the root of the project.');
  console.warn('    Vercel: Add the FIREBASE_SERVICE_ACCOUNT environment variable.\n');
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };
