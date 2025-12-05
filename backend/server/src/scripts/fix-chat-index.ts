import mongoose from "mongoose";
import Chat from "../models/Chat";
import "../config/database";

async function fixChatIndex() {
  try {
    console.log("🔧 Starting chat index fix...");

    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/campus-marketplace"
    );
    console.log("✅ Connected to database");

    // Get all existing indexes
    const indexes = await Chat.collection.getIndexes();
    console.log("📋 Current indexes:", Object.keys(indexes));

    // Drop all problematic unique indexes
    const indexesToDrop = ["participants_1", "participants_1_product_1"];
    for (const indexName of indexesToDrop) {
      try {
        await Chat.collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`ℹ️  Index ${indexName} not found or already dropped`);
      }
    }

    // Get all existing chats
    const chats = await Chat.find({});
    console.log(`📊 Found ${chats.length} existing chats`);

    // Find and fix duplicate chats (same participants, different order)
    const chatMap = new Map<string, any>();
    const chatsToDelete: string[] = [];

    for (const chat of chats) {
      const participants = chat.participants
        .map((p: any) => p.toString())
        .sort();
      const key = participants.join("-");

      if (chatMap.has(key)) {
        // Duplicate found - merge messages if needed and mark for deletion
        const existingChat = chatMap.get(key);

        // If the duplicate has messages, merge them
        if (chat.messages.length > 0) {
          console.log(`🔀 Merging messages from duplicate chat ${chat._id}`);
          existingChat.messages.push(...chat.messages);
          // Sort messages by timestamp
          existingChat.messages.sort(
            (a: any, b: any) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          await existingChat.save();
        }

        chatsToDelete.push(chat._id.toString());
        console.log(`🗑️  Marked duplicate chat ${chat._id} for deletion`);
      } else {
        // First occurrence - normalize participant order
        const sortedParticipants = chat.participants
          .map((p: any) => p._id || p)
          .sort((a: any, b: any) => a.toString().localeCompare(b.toString()));

        // Only update if order changed
        const originalOrder = chat.participants
          .map((p: any) => (p._id || p).toString())
          .join("-");
        const sortedOrder = sortedParticipants
          .map((p: any) => p.toString())
          .join("-");

        if (originalOrder !== sortedOrder) {
          console.log(`🔄 Reordering participants for chat ${chat._id}`);
          chat.participants = sortedParticipants;
          await chat.save();
        }

        chatMap.set(key, chat);
      }
    }

    // Delete duplicate chats
    if (chatsToDelete.length > 0) {
      await Chat.deleteMany({ _id: { $in: chatsToDelete } });
      console.log(`✅ Deleted ${chatsToDelete.length} duplicate chats`);
    }

    console.log("✅ Chat index fix completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing chat index:", error);
    process.exit(1);
  }
}

fixChatIndex();
