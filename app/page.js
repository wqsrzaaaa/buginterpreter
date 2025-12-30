"use client";

import Chats from "@/components/Chats";
import CollapsibleRightSidebar from "@/components/SideBar";
import React, { useState } from "react";

const Page = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatId, setChatId] = useState(null);

  return (
    <div className="relative overflow-hidden">
      <main
        className={`transition-all duration-500 ${
          isSidebarOpen ? "sm:pr-72 pr-0" : "sm:pr-10 pr-0"
        }`}
      >
        <Chats chatId={chatId} setChatId={setChatId} />
      </main>

      <CollapsibleRightSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        setChatId={setChatId}   
      />
    </div>
  );
};

export default Page;
