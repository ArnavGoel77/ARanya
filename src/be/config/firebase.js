const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

try {
  // The service account JSON should be placed in the root of the project
  const serviceAccountPath = path.resolve(__dirname, '../../../firebase-adminsdk.json');
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully.');
  }
} catch (error) {
  console.warn('\n[!] Firebase Admin SDK warning: Could not find firebase-adminsdk.json at the root of the project.');
  console.warn('    Please download it from Firebase Console and place it at: C:\\ARanya\\firebase-adminsdk.json\n');
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };
