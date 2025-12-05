import mongoose from "mongoose";
import Chat from "../models/Chat";
import { config } from "dotenv";

// Load environment variables
config();

async function fixChatParticipants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    // Get all chats
    const chats = await Chat.find({});
    console.log(`Found ${chats.length} chats to process`);

    let updated = 0;
    let skipped = 0;

    for (const chat of chats) {
      const participants = chat.participants.map((p) => p.toString());
      const sortedParticipants = [...participants].sort((a, b) =>
        a.localeCompare(b)
      );

      // Check if participants are already sorted
      const isSorted = participants.every(
        (p, i) => p === sortedParticipants[i]
      );

      if (!isSorted) {
        // Update the chat with sorted participants
        chat.participants = sortedParticipants.map(
          (p) => new mongoose.Types.ObjectId(p)
        );
        await chat.save();
        console.log(
          `Updated chat ${chat._id}: ${participants.join(
            ", "
          )} -> ${sortedParticipants.join(", ")}`
        );
        updated++;
      } else {
        skipped++;
      }
    }

    console.log(`\nCompleted! Updated: ${updated}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("Error fixing chat participants:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the fix
fixChatParticipants();
