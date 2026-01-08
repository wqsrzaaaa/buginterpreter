"use client";

import run from '../app/MyApi';
import { useLanguage } from "./context/LangProvider";
import React, { useEffect, useRef, useState } from "react";
import { Send, Bot, Mic, BrainCog, UploadCloud, Upload, Paperclip } from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, storage } from "../Firebase";
import { ref as storageRefFirebase, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from 'next/image';
import AiRes from './AiRes';
import formatAIResponse from '@/components/FormatAirespo'
import { handleMic } from './Handlemic';

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


  const onSent = async (userText) => {
    // Require typed text
    if (!userText.trim()) return;
    if (isLoading) return;

    setInput("");
    setIsLoading(true);
    setImagePreview(null)


    let imageBase64 = null;
    if (imageFile) {
      try {
        imageBase64 = await fileToBase64(imageFile);
      } catch (err) {
        console.error("Error converting file to base64", err);
      }
    }

    const userMessage = {
      role: "user",
      text: userText.replace(/\n/g, "<br />"),
      createdAt: new Date(),
      image: imageBase64 || null, // send base64 directly
    };
    setMessages(prev => {
      const newMsgs = [
        ...prev,
        userMessage,
        { role: "bot", text: "", data: null, createdAt: new Date() }, // bot placeholder
      ];
      persistMessages(newMsgs);
      return newMsgs;
    });

    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await fileToBase64(imageFile);

      const aiResult = await run(userText, language.label, imageBase64);

      if (!aiResult?.ok) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: "⚠️ Failed to analyze the error.",
          };
          return updated;
        });
        setIsLoading(false);
        return;
      }

      const botMessage = {
        role: "bot",
        text: "",
        data: aiResult.data,
        createdAt: new Date(),
        image: null,
      };

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = botMessage;
        persistMessages(updated);
        return updated;
      });

      setIsLoading(false);
      setImageFile(null);
      setImagePreview(null);

    } catch (e) {
      console.error("AI call error:", e);
      setMessages(prev => {
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
        {zoom && (
          <div onClick={() => setzoom(false)} className='w-full h-screen fixed top-0 left-0 z-999 flex items-center justify-center '>
            <div className='w-full h-full absolute left-0 top-0 bg-black/30'></div>
            <Image src={imagePreview} width={704} height={704} className='w-[80%]  h-[90%] object-contain rounded-md' alt='myerrorimage' />
          </div>
        )}
        {imagePreview && (
          <div className=' w-full h-24 mb-2 pl-3'>
            <Image onClick={() => setzoom(true)} src={imagePreview} width={34} height={34} className='w-24  h-24 object-cover rounded-md' alt='myerrorimage' />
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
