const admin = require("firebase-admin");

// Load the service account key (Replace './path-to-serviceAccountKey.json' with the actual path)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateCollectionToSubcollection() {
  const collectionName = "Patients"; // The collection you want to migrate and the to be parent document ID
  const newParentCollection = "Users"; // The new parent collection
  const subCollectionName = "UsersDocs" // The docoument subCollection

  try {
    // Fetch all documents from the original collection
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log("No documents found in the collection.");
      return;
    }

    // Iterate through each document and copy it to the subcollection
    const batch = db.batch();
    snapshot.forEach((doc) => {
      const data = doc.data();
      const newDocRef = db
        .collection(newParentCollection)
        .doc(collectionName)
        .collection(subCollectionName)
        .doc(doc.id);

      batch.set(newDocRef, data); // Copy the document
      batch.delete(doc.ref); // Optional: Delete the original document
    });

    await batch.commit();
    console.log("Migration complete!");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

migrateCollectionToSubcollection();
