const { db } = require('../config/firebase');
const plantsData = require('../routes/plants/seed_schema.json');

const seedPlants = async () => {
  if (!db) {
    console.error('Firestore is not initialized. Please ensure firebase-adminsdk.json is present before running this script.');
    process.exit(1);
  }

  try {
    const batch = db.batch();
    const plantsCollection = db.collection('plants');

    console.log(`Starting to seed ${plantsData.length} plants into Firestore...`);

    plantsData.forEach((plant) => {
      // Use plant_id as the document ID for easy querying later
      const docRef = plantsCollection.doc(plant.plant_id);
      batch.set(docRef, plant);
    });

    await batch.commit();
    console.log('Successfully seeded plants collection!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding plants:', error);
    process.exit(1);
  }
};

seedPlants();
