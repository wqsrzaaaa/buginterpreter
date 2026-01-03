"use client";

import run from '../app/MyApi';
import { useLanguage } from "./context/LangProvider";
import React, { useEffect, useRef, useState } from "react";
import { Send, Bot, Mic, BrainCog, UploadCloud } from "lucide-react";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, addDoc, collection, onSnapshot } from "firebase/firestore";
import { db, storage } from "../Firebase";
import { ref as storageRefFirebase, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from 'next/image';
import AiRes from './AiRes';

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

  const recognitionRef = useRef(null);
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

  // Scroll to bottom when messages change
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

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file) => {
    if (!file || !chatId) return null;
    try {
      const path = `chat-images/${chatId}/${Date.now()}_${file.name}`;
      const sRef = storageRefFirebase(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      return url;
    } catch (e) {
      console.error("Image upload failed:", e);
      return null;
    }
  };

  const handleCopy = async (text, index) => {
    await navigator.clipboard.writeText(text.replace(/<br\s*\/?>/g, "\n"));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleMic = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      let finalTranscript = "";

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += (finalTranscript ? " " : "") + transcript;
            setInput(finalTranscript);
          } else {
            interimTranscript += transcript;
            setInput(finalTranscript + (interimTranscript ? " " + interimTranscript : ""));
          }
        }
      };

      recognitionRef.current.onend = () => setRecording(false);
    }

    recognitionRef.current.lang = language.code;

    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      recognitionRef.current.start();
      setRecording(true);
    }
  };


  console.log(imagePreview);
  

  const tempImageBase64 = ""

const onSent = async (userText) => {
  if (!userText.trim() && !imageFile) return;
  if (isLoading) return;

  setInput("");
  setIsLoading(true);

  const userMessage = {
    role: "user",
    text: userText.replace(/\n/g, "<br />"),
    createdAt: new Date(),
    image: imagePreview, 
  };

  setMessages(prev => {
    const newMsgs = [...prev, userMessage, { role: "bot", text: "", createdAt: new Date() }];
    persistMessages(newMsgs);
    return newMsgs;
  });

  let response = "";

  try {
    response = await run(
      userText,
      language.label,
      imagePreview 
    );
  } catch (e) {
    response = "Sorry, I couldn't get a response right now.";
    console.error(e);
  }

  if (imageFile) {
    try {
      const url = await uploadImage(imageFile);
      if (url) userMessage.image = url;
    } catch (e) {
      console.error("Image upload failed after AI:", e);
    }
  }

  let ResultArray = response.split("**");
  let newResponse = "";
  for (let i = 0; i < ResultArray.length; i++) {
    if (i === 0 || i % 2 !== 1) newResponse += ResultArray[i];
    else newResponse += "<b>" + ResultArray[i] + "</b>";
  }

  let NewResp2 = newResponse.split("*").join("</br>");

  function removeDuplicates(str) {
  return str.split(" ").filter((word, i, arr) => word !== arr[i - 1]).join(" ");
}


  let cleanResponse = removeDuplicates(NewResp2);
  let words = cleanResponse.split(" ");

  let i = 0;
  const interval = setInterval(() => {
    setMessages(prev => {
      const updated = [...prev];
      const botIndex = updated.length - 1;
      updated[botIndex] = {
        ...updated[botIndex],
        text: (updated[botIndex].text || "") + words[i] + " ",
      };
      return updated;
    });

    i++;
    if (i >= words.length) {
      clearInterval(interval);
      setIsLoading(false);

      setMessages(prev => {
        const updated = [...prev];
        const userIndex = updated.findIndex(m => m === userMessage);
        if (userIndex !== -1) updated[userIndex] = userMessage;
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
      // initialize new chat
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
        setzoom={setzoom}
        setImageZoom={setImageZoom}
        mounted={mounted}
        formatTime={formatTime}
        handleCopy={handleCopy}
        copiedIndex={copiedIndex}
        Bot={Bot}
        imagePreview={imagePreview}
      />
      {/* Input */}
      <div className="p-3 flex flex-wrap items-end bg-transparent ">
        {imagePreview && (
          <div className='w-full h-25 flex items-end gap-6 pb-2'>
            <img src={imagePreview}
              onClick={() => (setzoom(true), setImageZoom(imagePreview))}
              alt="uploaded" className="w-24 h-24 object-cover cursor-pointer rounded-md" />
          </div>
        )}

        {ImageZoom && (
          <div onClick={() => setImageZoom(null)} className='w-full h-screen flex items-center z-99 justify-center fixed top-0 left-0'>
            <div className='w-full h-screen bg-black/40 absolute top-0 left-0'>
            </div>
            <Image src={ImageZoom} alt='image' width={600} height={600} />
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
          placeholder="Type anything..."
          className="flex-1 px-3 py-2 min-h-12 relative z-6 mr-2 pr-25 custom-scrollbar resize-none border border-hardborder rounded-xl bg-transparent placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring"
        />

        <div className="relative z-12">
          <button
            onClick={() => document.getElementById('file-input')?.click()}
            className="px-3 py-2 absolute bottom-2 right-17 h-10 flex items-center justify-center rounded-md border"
          >
            <UploadCloud />
          </button>

          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        <button onClick={handleMic} className="p-2 z-12 w-11 absolute bottom-5 right-19 h-10 flex items-center justify-center rounded-md border">
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
