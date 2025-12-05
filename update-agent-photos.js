// update-agent-photos.js
// Run this ONCE to add photo URLs to existing agents in Firebase
// Usage: node update-agent-photos.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASgtk7IbBZbOVDMtGvlZtQWeO0ezgljQc",
  authDomain: "prd-offer-tool.firebaseapp.com",
  projectId: "prd-offer-tool",
  storageBucket: "prd-offer-tool.firebasestorage.app",
  messagingSenderId: "124641181600",
  appId: "1:124641181600:web:89b578ca25243ec89d2ec5"
};

// Agent photo URLs from PRD website
// Format: { "Agent Name": "photo URL" }
const AGENT_PHOTOS = {
  "Adrian Sechtig": "https://prdburleighheads.com.au/wp-content/uploads/2021/10/Adrian-1.png",
  "Alex Kennedy": "https://prdburleighheads.com.au/wp-content/uploads/2025/01/Alex-Kennedy.png",
  "Ben Fields": "https://prdburleighheads.com.au/wp-content/uploads/2021/10/Ben-Fields.png",
  "Ben Snell": "https://prdburleighheads.com.au/wp-content/uploads/2023/03/Ben-Snell.png",
  "Braiden Smith": "https://prdburleighheads.com.au/wp-content/uploads/2021/10/Braiden-Smith.png",
  "Bronte Hodgins": "https://prdburleighheads.com.au/wp-content/uploads/2023/10/Bronte-Hodgins.png",
  "Caitlin Gall": "https://prdburleighheads.com.au/wp-content/uploads/2023/03/Caitlin-Gall.png",
  "Callum Fitzgerald": "https://prdburleighheads.com.au/wp-content/uploads/2024/02/Callum-Fitzgerald.png",
  "Dean Wildbore": "https://prdburleighheads.com.au/wp-content/uploads/2023/03/Dean-Wildbore.png",
  "Ellen Nicholl": "https://prdburleighheads.com.au/wp-content/uploads/2024/07/Ellen-Nicholl.png",
  "Freddie Tehle": "https://prdburleighheads.com.au/wp-content/uploads/2021/10/Freddie-Tehle.png",
  "Grace Sullivan": "https://prdburleighheads.com.au/wp-content/uploads/2024/07/Grace-Sullivan.png",
  "Jade Dearlove": "https://prdburleighheads.com.au/wp-content/uploads/2023/03/Jade-Dearlove.png",
  "Jemma Psaila": "https://prdburleighheads.com.au/wp-content/uploads/2024/02/Jemma-Psaila.png",
  "Jessie Leeming": "https://prdburleighheads.com.au/wp-content/uploads/2023/11/Jessie-Leeming.png",
  "John Fischer": "https://prdburleighheads.com.au/wp-content/uploads/2021/10/John-Fischer.png",
  "Luke Wright": "https://prdburleighheads.com.au/wp-content/uploads/2023/03/Luke-Wright.png",
  "Mark Shinners": "https://prdburleighheads.com.au/wp-content/uploads/2021/10/Mark-Shinners.png",
  "Paddy Quinn": "https://prdburleighheads.com.au/wp-content/uploads/2023/03/Paddy-Quinn.png",
  "Paula Dunford": "https://prdburleighheads.com.au/wp-content/uploads/2022/07/Paula.png",
  "Shelley Watkins": "https://prdburleighheads.com.au/wp-content/uploads/2021/10/Shelley-Watkins.png",
  "Talitha Jose": "https://prdburleighheads.com.au/wp-content/uploads/2023/03/Talitha-Jose.png"
};

async function updateAgentPhotos() {
  console.log("🔥 Connecting to Firebase...");
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const agentsCollection = collection(db, "agents");

  console.log("📸 Fetching existing agents...");
  const snapshot = await getDocs(agentsCollection);
  
  let updated = 0;
  let skipped = 0;

  for (const agentDoc of snapshot.docs) {
    const data = agentDoc.data();
    const photoUrl = AGENT_PHOTOS[data.name];
    
    if (photoUrl) {
      try {
        await updateDoc(doc(db, "agents", agentDoc.id), {
          photo: photoUrl
        });
        console.log(`   ✅ Updated: ${data.name}`);
        updated++;
      } catch (error) {
        console.error(`   ❌ Failed to update ${data.name}:`, error.message);
      }
    } else {
      console.log(`   ⚠️  No photo found for: ${data.name}`);
      skipped++;
    }
  }

  console.log(`\n🎉 Done! Updated ${updated} agents, skipped ${skipped}.`);
  console.log("   Refresh your app to see the photos.");
  
  process.exit(0);
}

updateAgentPhotos().catch(console.error);