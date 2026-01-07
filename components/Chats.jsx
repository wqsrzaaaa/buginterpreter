"use client";

import run from '../app/MyApi';
import { useLanguage } from "./context/LangProvider";
import React, { useEffect, useRef, useState } from "react";
import { Send, Bot, Mic, BrainCog, UploadCloud } from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, storage } from "../Firebase";
import { ref as storageRefFirebase, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from 'next/image';
import AiRes from './AiRes';
import formatAIResponse from '@/components/FormatAirespo'
import VoiceInput, { handleMic } from './Handlemic';

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
  const [ImageZoom, setImageZoom] = useState(null)
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);


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
    if (!chatId) return;
    const load = async () => {
      try {
        const chatRef = doc(db, "chats", chatId);
        const snap = await getDoc(chatRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            // initialize doc
            await setDoc(chatRef, { messages: defaultWelcome, userId: "anonymous", createdAt: serverTimestamp() }, { merge: true });
            setMessages(defaultWelcome);
          }
        } else {
          await setDoc(chatRef, { messages: defaultWelcome, userId: "anonymous", createdAt: serverTimestamp() });
          setMessages(defaultWelcome);
        }
      } catch (e) {
        console.error("Failed to load chat:", e);
      }
    };
    load();
  }, [chatId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight + 200;
    }
  }, [messages]);

  const persistMessages = async (msgs) => {
    if (!chatId) return;
    try {
      const chatRef = doc(db, "chats", chatId);
      await setDoc(chatRef, { messages: msgs }, { merge: true });
    } catch (e) {
      console.error("Failed to persist messages:", e);
    }
  };

 



  const uploadImageToFirebase = async (file) => {
    if (!file || !chatId) return null;

    const imageRef = storageRefFirebase(
      storage,
      `chat-images/${chatId}/${Date.now()}-${file.name}`
    );

    await uploadBytes(imageRef, file);

    const httpsUrl = await getDownloadURL(imageRef);
    return httpsUrl; // ✅ ONLY HTTPS URL
  };




  const handleCopy = async (text, index) => {
    await navigator.clipboard.writeText(text.replace(/<br\s*\/?>/g, "\n"));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };


  const escapeHtml = (unsafe) => {
    if (!unsafe && unsafe !== "") return "";
    return String(unsafe)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  function removeDuplicateWords(str) {
    return str.split(" ").filter((word, i, arr) => word !== arr[i - 1]).join(" ");
  }

  const onSent = async (userText) => {
    if (!userText.trim() && !imageFile) return;
    if (isLoading) return;

    setInput("");
    setIsLoading(true);

    let imageUrl = null;
    if (imageFile) {
      try {
        imageUrl = await uploadImageToFirebase(imageFile);
        if (!imageUrl) imageUrl = imagePreview;
      } catch (e) {
        console.error("Upload error, using preview instead:", e);
        imageUrl = imagePreview;
      }
    }

    const userMessage = {
      role: "user",
      text: userText.replace(/\n/g, "<br />"),
      createdAt: new Date(),
      image: imageUrl || null,
    };

    setMessages(prev => {
      const newMsgs = [
        ...prev,
        userMessage,
        { role: "bot", text: "", createdAt: new Date() } 
      ];
      persistMessages(newMsgs);
      return newMsgs;
    });
    let aiText = "Sorry, I couldn't get a response right now.";
    try {
      const aiResult = await run(userText, language.label, imageUrl);

      if (!aiResult || !aiResult.ok) {
        aiText = "⚠️ Failed to analyze the error.";
      } else {
        const raw = formatAIResponse(aiResult.data || {});
        const escaped = escapeHtml(raw);
        aiText = escaped.replace(/\n/g, "<br />");
      }
    } catch (e) {
      console.error("AI call error:", e);
      aiText = "Sorry, I couldn't get a response right now.";
    }

    let cleanResponse = removeDuplicateWords(aiText);
    cleanResponse = cleanResponse
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.+?)\*/g, "<i>$1</i>");

    const words = cleanResponse.split(" ");
    let idx = 0;

    const interval = setInterval(() => {
      setMessages(prev => {
        const updated = [...prev];
        const botIndex = updated.length - 1;
        updated[botIndex] = {
          ...updated[botIndex],
          text: (updated[botIndex].text || "") + (words[idx] || "") + " "
        };
        return updated;
      });

      idx++;
      if (idx >= words.length) {
        clearInterval(interval);
        setIsLoading(false);

        // Final persist: make sure the user message is stored and bot message is final
        setMessages(prev => {
          const updated = [...prev];
          // Ensure user message stored correctly (match by timestamp)
          const maybeUserMsgIndex = updated.findIndex(m => m.role === "user" && m.text === userMessage.text && new Date(m.createdAt).getTime() === new Date(userMessage.createdAt).getTime());
          if (maybeUserMsgIndex === -1) {
            // fallback: replace the second-last element (where user normally is)
            updated[updated.length - 2] = userMessage;
          } else {
            updated[maybeUserMsgIndex] = userMessage;
          }
          persistMessages(updated);
          return updated;
        });

        setImageFile(null);
        setImagePreview(null);
      }
    }, 40);
  };


  useEffect(() => {
    if (!chatId) {
      setMessages(defaultWelcome);
      return;
    }

    const chatRef = doc(db, "chats", chatId);

    const unsub = onSnapshot(chatRef, async (snap) => {
      if (snap.exists()) {
        setMessages(snap.data().messages || defaultWelcome);
      } else {
        await setDoc(chatRef, {
          messages: defaultWelcome,
          createdAt: serverTimestamp(),
        });
        setMessages(defaultWelcome);
      }
    });

    return () => unsub();
  }, [chatId]);

  const handleSend = () => onSent(Input);

  const [showThinking, setShowThinking] = useState(false);

  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowThinking(true);
      }, 6000);
    } else {
      setShowThinking(false);
    }

    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => setMounted(true), []);




  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-background">
      <div className="p-4 border-b border-border relative flex items-center gap-2 z-3 bg-background font-semibold">
        <BrainCog /> Bug Interpreter
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
      />
      <div className="p-3 flex flex-wrap items-end bg-transparent ">
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
          placeholder="Type anything..."
          className="flex-1 px-3 py-2 min-h-12 relative z-6 mr-2 pr-25 custom-scrollbar resize-none border border-hardborder rounded-xl bg-transparent placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring"
        />


        <button
        onClick={() =>
          handleMic({ 
            recognitionRef, 
            recording, 
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
