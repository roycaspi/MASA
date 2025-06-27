const admin = require('firebase-admin');

// Path to your service account key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateUserPointers() {
  const userDocs = await db.collection('Users').get();
  let updatedCount = 0;

  for (const userDoc of userDocs.docs) {
    const data = userDoc.data();
    if (data.Pointer) {
      continue; // Already has a pointer
    }

    const uid = userDoc.id;
    let found = false;
    const profileCollections = ['Therapists', 'Patients', 'Attendants'];

    for (const collection of profileCollections) {
      const profileDoc = await db.collection(collection).doc(uid).get();
      if (profileDoc.exists) {
        await userDoc.ref.update({
          Pointer: profileDoc.ref
        });
        console.log(`Updated user ${uid} with pointer to ${collection}/${uid}`);
        updatedCount++;
        found = true;
        break;
      }
    }

    if (!found) {
      console.warn(`No profile found for user ${uid}. Skipped.`);
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} user(s).`);
}

migrateUserPointers().catch(console.error);