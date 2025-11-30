// seed-agents.js
// Run this ONCE to populate your Firebase with agents
// Usage: node seed-agents.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";

// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyASgtk7IbBZbOVDMtGvlZtQWeO0ezgljQc",
  authDomain: "prd-offer-tool.firebaseapp.com",
  projectId: "prd-offer-tool",
  storageBucket: "prd-offer-tool.firebasestorage.app",
  messagingSenderId: "124641181600",
  appId: "1:124641181600:web:89b578ca25243ec89d2ec5"
};

// Default Agents to Add
const DEFAULT_AGENTS = [
  { name: 'General Office', email: 'admin@prdburleighheads.com.au' },
  { name: 'Adrian Sechtig', email: 'adrian@prdburleighheads.com.au' },
  { name: 'Alex Kennedy', email: 'alex@prdburleighheads.com.au' },
  { name: 'Ben Fields', email: 'ben@prdburleighheads.com.au' },
  { name: 'Ben Snell', email: 'bens@prdburleighheads.com.au' },
  { name: 'Braiden Smith', email: 'braiden@prdburleighheads.com.au' },
  { name: 'Bronte Hodgins', email: 'bronte@prdburleighheads.com.au' },
  { name: 'Caitlin Gall', email: 'caitlin@prdburleighheads.com.au' },
  { name: 'Callum Fitzgerald', email: 'callum@prdburleighheads.com.au' },
  { name: 'Dean Wildbore', email: 'dean@prdburleighheads.com.au' },
  { name: 'Ellen Nicholl', email: 'ellen@prdburleighheads.com.au' },
  { name: 'Freddie Tehle', email: 'freddie@prdburleighheads.com.au' },
  { name: 'Grace Sullivan', email: 'grace@prdburleighheads.com.au' },
  { name: 'Jade Dearlove', email: 'jade@prdburleighheads.com.au' },
  { name: 'Jemma Psaila', email: 'jemma@prdburleighheads.com.au' },
  { name: 'Jessie Leeming', email: 'jessie@prdburleighheads.com.au' },
  { name: 'John Fischer', email: 'john@prdburleighheads.com.au' },
  { name: 'Luke Wright', email: 'luke@prdburleighheads.com.au' },
  { name: 'Mark Shinners', email: 'mark@prdburleighheads.com.au' },
  { name: 'Paddy Quinn', email: 'paddy@prdburleighheads.com.au' },
  { name: 'Paula Dunford', email: 'paula@prdburleighheads.com.au' },
  { name: 'Shelley Watkins', email: 'shelley@prdburleighheads.com.au' },
  { name: 'Talitha Jose', email: 'talitha@prdburleighheads.com.au' }
];

async function seedAgents() {
  console.log("🔥 Connecting to Firebase...");
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const agentsCollection = collection(db, "agents");

  // Optional: Clear existing agents first
  console.log("🗑️  Clearing existing agents...");
  const existingAgents = await getDocs(agentsCollection);
  for (const doc of existingAgents.docs) {
    await deleteDoc(doc.ref);
  }
  console.log(`   Deleted ${existingAgents.size} existing agents`);

  // Add all agents
  console.log("📝 Adding agents to Firebase...");
  
  for (const agent of DEFAULT_AGENTS) {
    try {
      await addDoc(agentsCollection, {
        name: agent.name,
        email: agent.email
      });
      console.log(`   ✅ Added: ${agent.name}`);
    } catch (error) {
      console.error(`   ❌ Failed to add ${agent.name}:`, error.message);
    }
  }

  console.log("\n🎉 Done! All agents have been added to Firebase.");
  console.log("   You can now refresh your app to see the agents.");
  
  process.exit(0);
}

seedAgents().catch(console.error);