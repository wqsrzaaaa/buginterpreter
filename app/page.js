"use client";

import Chats from "@/components/Chats";
import CollapsibleRightSidebar from "@/components/SideBar";
import { db } from "@/Firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";

const Page = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
const [currentChatId, setCurrentChatId] = useState(null);


    const createChat = async () => {
      const docRef = await addDoc(collection(db, "chats"), {
        messages: [
          {
            role: "bot",
            text: "Hi 👋 I'm Bug Interpreter. Paste your error and I will simplify it for you",
            createdAt: new Date(),
          },
        ],
        createdAt: serverTimestamp(),
      });
      setCurrentChatId(docRef.id)
  
      return docRef.id;
    };

  return (
    <div className="relative overflow-hidden">
      <main
        className={`transition-all duration-500 ${
          isSidebarOpen ? "sm:pr-72 pr-0" : "sm:pr-10 pr-0"
        }`}
      >
        <Chats currentChatId={currentChatId} chatId={chatId} setChatId={setChatId} />
      </main>

      <CollapsibleRightSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        createChat={createChat}
      />
    </div>
  );
};

export default Page;
