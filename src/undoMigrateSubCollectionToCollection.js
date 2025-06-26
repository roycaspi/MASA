const admin = require("firebase-admin");
// Load the service account key (Replace './path-to-serviceAccountKey.json' with the actual path)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function undoMigration() {
  const collectionName = "Therapists"; // The subcollection name
  const parentCollection = "Users"; // The parent collection
  const parentDocId = "UsersDocs"; // The parent document ID
  const originalCollection = "Therapists"; // The original top-level collection

  try {
    // Reference the subcollection
    const subcollectionRef = db
      .collection(parentCollection)
      .doc(collectionName)
      .collection(parentDocId);

    // Fetch all documents from the subcollection
    const snapshot = await subcollectionRef.get();

    if (snapshot.empty) {
      console.log("No documents found in the subcollection.");
      return;
    }

    // Iterate through each document and copy it to the original collection
    const batch = db.batch();
    snapshot.forEach((doc) => {
      const data = doc.data();
      const newDocRef = db.collection(originalCollection).doc(doc.id);

      batch.set(newDocRef, data); // Copy the document
      batch.delete(doc.ref); // Optional: Delete the document from the subcollection
    });

    await batch.commit();
    console.log("Undo migration complete!");
  } catch (error) {
    console.error("Error during undo migration:", error);
  }
}

undoMigration();
