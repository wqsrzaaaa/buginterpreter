"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bot,
  MessageCircleDashed,
} from "lucide-react";
import { Theme } from "./Theme";
import LanguageSelector from "./LanguageSelector";

const dummyChats = [
  { id: 1, title: "My Old Chats", lastMessage: "Old chats are currently unavailable" },
];

export default function CollapsibleRightSidebar({ isOpen, setIsOpen, setreloadScale , createChat, currentChatId }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem("chatId", currentChatId);
      window.location.reload()
    }
  }, [currentChatId]);



  if (!mounted) return null;

  return (
    <aside
      className={`fixed top-0 h-screen  z-50 flex flex-col
       bg-background text-foreground
      border-l border-border transition-all duration-500 w-72
      ${isOpen ? "right-0 " : "sm:-right-62 -right-72 "}`}
    >
      <div
        className={`absolute top-0 -left-30 sm:-left-70 w-30 sm:w-70 h-14.25 px-3
        bg-background
        border border-border
        rounded-l-md flex items-center justify-center gap-4 cursor-pointer z-50`}
      >
        <div className="sm:block hidden"><LanguageSelector /></div>
        <Theme />
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <div className="flex items-center gap-2 p-4 border-b border-border">
        <h2 className="hidden sm:flex items-center gap-2"><RotateCcw size={18} /> History  </h2> <div className='sm:hidden block'><LanguageSelector /></div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div
          onClick={()=> (createChat() , setreloadScale(true))}
          className="flex items-center gap-2 p-3 py-4 cursor-pointer hover:bg-hoverbg"
        >
          <Bot size={18} /> New Chat
        </div>


        {dummyChats.map((chat) => (
          <div
            key={chat.id}
            className="flex flex-col p-3 cursor-pointer hover:bg-hoverbg border-b border-border"
          >
            <div className="flex items-center gap-2">
              <MessageCircleDashed size={18} />
              <span className="font-semibold">{chat.title}</span>
            </div>
            <p className="text-xs pl-7 text-muted-foreground truncate">
              {chat.lastMessage}
            </p>
          </div>
        ))}
      </nav>
    </aside>
  );
}
