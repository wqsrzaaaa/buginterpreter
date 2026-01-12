"use client";

import run from '../app/MyApi';
import { useLanguage } from "./context/LangProvider";
import React, { useEffect, useRef, useState } from "react";
import { Send, Bot, Mic, Paperclip } from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase";
import Image from 'next/image';
import AiRes from './AiRes';
import { handleMic } from './Handlemic';
import { useTheme } from 'next-themes';

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const defaultWelcome = [
  { role: "bot", text: "Hi 👋 I'm Bug Interpreter. Paste your error and i will simplify it for you", createdAt: new Date() }
];




const Chats = ({ setChatId, chatId }) => {
  const [Input, setInput] = useState("");
  const [messages, setMessages] = useState(defaultWelcome);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [zoom, setzoom] = useState(false)
  const [imageFile, setImageFile] = useState(null);
  const [globleimg, setglobleimg] = useState(null)

  const imageref = useRef()
  const recognitionRef = useRef()
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const { language } = useLanguage();

  useEffect(() => {
    const existing = localStorage.getItem("chatId");
    if (existing) setChatId(existing);
    else {
      const id = crypto.randomUUID?.() || `chat_${Date.now()}`;
      localStorage.setItem("chatId", id);
      setChatId(id);
    }
  }, []);

  



  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight + 200;
    }
  }, [messages]);


  const handleCopy = async (text, index) => {
    await navigator.clipboard.writeText(text.replace(/<br\s*\/?>/g, "\n"));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };


  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };


  const typeText = (text, index) => {
    const words = text.split(" ");
    let current = "";
    let i = 0;

    const interval = setInterval(() => {
      setMessages(prev => {
        if (!prev[index]) return prev;

        current += (i === 0 ? "" : " ") + words[i];
        const updated = [...prev];
        updated[index] = { ...updated[index], text: current };
        return updated;
      });

      i++;
      if (i >= words.length) clearInterval(interval);
    }, 35);
  };

const persistMessages = async (updatedMessages) => {
  // make sure chatId exists
  if (!chatId) {
    console.warn("persistMessages called but chatId empty — creating one now.");
    await ensureChatId();
  }
  try {
    const chatRef = doc(db, "chats", chatId);
    await setDoc(
      chatRef,
      {
        messages: updatedMessages,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("setDoc error while persisting messages:", err);
  }
};



const onSent = async (userText) => {
  if (!userText.trim()) return;
  if (isLoading) return;

  setInput("");
  setIsLoading(true);
  setImagePreview(null);

  // convert file
  let imageBase64 = null;
  if (imageFile) {
    try {
      imageBase64 = await fileToBase64(imageFile);
    } catch (err) {
      console.error("Error converting file to base64", err);
    }
  }

  // use imageBase64 (not base64)
  const userMsg = {
    role: "user",
    text: userText,
    image: imageBase64,
    createdAt: Date.now(),
  };

  const botMsg = {
    role: "bot",
    text: "",
    data: null,
    createdAt: Date.now(),
  };

  let botIndex;
  setMessages(prev => {
    const updated = [...prev, userMsg, botMsg];
    botIndex = updated.length - 1;
    // persist but do not block UI — persistMessages has its own try/catch
    persistMessages(updated);
    return updated;
  });

  try {
    // pass imageBase64 to run
    const res = await run(userText, "English", imageBase64);

    const reply =
      res?.data?.rootCause ||
      res?.data?.message ||
      "No response from AI.";

    typeText(reply, botIndex);

    setTimeout(() => {
      setMessages(prev => {
        const updated = [...prev];
        if (!updated[botIndex]) return prev;
        updated[botIndex] = {
          ...updated[botIndex],
          text: reply,
          data: res.data,
        };
        // persist update
        persistMessages(updated);
        return updated;
      });
      setIsLoading(false);
      setImageFile(null);
    }, reply.split(" ").length * 35 + 200);
  } catch (e) {
    console.error("AI call error:", e);
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        text: "⚠️ AI call failed.",
      };
      return updated;
    });
    setIsLoading(false);
  }
};

// improved onSnapshot useEffect with error handler
useEffect(() => {
  if (!chatId) {
    setMessages(defaultWelcome);
    return;
  }

  const chatRef = doc(db, "chats", chatId);

  const unsub = onSnapshot(
    chatRef,
    async (snap) => {
      if (snap.exists()) {
        setMessages(snap.data().messages || defaultWelcome);
      } else {
        try {
          await setDoc(chatRef, {
            messages: defaultWelcome,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("Error creating chat document in onSnapshot else branch:", err);
        }
        setMessages(defaultWelcome);
      }
    },
    (error) => {
      // This is critical: log the exact Firestore listen error
      console.error("onSnapshot listen error:", error);
    }
  );

  return () => unsub();
}, [chatId]);

 
  const handleSend = () => onSent(Input);

  const [showThinking, setShowThinking] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isLoading) return; 

    const timer = setTimeout(() => {
      setShowThinking(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [isLoading]);



  const { theme } = useTheme();
  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-background">
      <div className="p-2 relative flex items-center gap-2 z-3 font-semibold">
        <Image
          src={theme === "dark" ? "/logo2.png" : "/logo1.png"}
          alt="logo"
          width={45}
          height={45}
        />
      </div>

      <AiRes 
        messagesContainerRef={messagesContainerRef}
        messages={messages}
        isLoading={isLoading}
        showThinking={showThinking}
        mounted={mounted}
        formatTime={formatTime}
        handleCopy={handleCopy}
        copiedIndex={copiedIndex}
        Bot={Bot}
        setzoom={setzoom}
        setglobleimg={setglobleimg}
      />
      <div className="p-3 flex flex-wrap items-end bg-transparent ">
        {zoom && (
          <div onClick={() => setzoom(false)} className='w-full h-screen fixed top-0 left-0 z-999 flex items-center justify-center '>
            <div className='w-full h-full absolute left-0 top-0 bg-black/30'></div>
            <Image src={globleimg} width={704} height={704} className='w-[80%]  h-[90%] object-contain rounded-md' alt='myerrorimage' />
          </div>
        )}
        {imagePreview && (
          <div className=' w-full h-24 mb-2 pl-3'>
            <Image onClick={() => (setzoom(true), setglobleimg(imagePreview))} src={imagePreview} width={34} height={34} className='w-24  h-24 object-cover rounded-md' alt='myerrorimage' />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={Input}
          onChange={(e) => setInput(e.target.value)}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
              if (textareaRef.current) textareaRef.current.style.height = "auto";
            }
          }}
          placeholder="Paste your error..."
          className="flex-1 px-3 py-2 min-h-12 relative z-6 mr-2 pr-25 custom-scrollbar resize-none border border-hardborder rounded-xl bg-transparent placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring"
        />


        <button
          onClick={() => imageref.current.click()}
          className="p-2 z-12 w-11 absolute bottom-5 right-31 h-10 flex items-center justify-center rounded-md border"
        >
          {<Paperclip size={16} className='-rotate-45' />}
        </button>
        <input
          type="file"
          className="hidden"
          ref={imageref}
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setImageFile(file);
              const reader = new FileReader();
              reader.onload = () => setImagePreview(reader.result);
              reader.readAsDataURL(file);
            }
          }}
        />


        <button
          onClick={() =>
            handleMic({
              recognitionRef,
              recording,
              Input,
              setRecording,
              setInput,
              language
            })
          }
          className="p-2 z-12 w-11 absolute bottom-5 right-19 h-10 flex items-center justify-center rounded-md border"
        >
          {!recording ? <Mic size={16} /> : <span className="loader"></span>}
        </button>

        <button
          onClick={handleSend}
          disabled={isLoading}
          className={`px-4 py-2 h-10 mb-1 rounded-md relative z-12 flex items-center gap-1 ${isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 text-white"}`}
        >
          <Send size={16} />
        </button>

      </div>
    </div>
  );
};

export default Chats;
