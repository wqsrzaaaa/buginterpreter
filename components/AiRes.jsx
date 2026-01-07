import React from "react";
import LoaderAI from "./LoaderAI";
import { Timestamp } from "firebase/firestore";
import { Check, Copy, User } from "lucide-react";

const AiRes = ({
  messagesContainerRef,
  messages,
  isLoading,
  showThinking,
  mounted,
  formatTime,
  handleCopy,
  copiedIndex,
  Bot,
}) => {
  const copyLink = async (url, idx) => {
    try {
      await navigator.clipboard.writeText(url);
      if (handleCopy) handleCopy(url, idx);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar"
    >
      {messages.length > 1 ? (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "bot" && Bot && <Bot size={20} />}

              <div
                className={`relative group px-4 mb-5 py-2 rounded-lg max-w-[70%] w-auto text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-hoverbg"
                  }`}
              >
                {msg.role === "bot" && isLoading && index === messages.length - 1 ? (
                  <LoaderAI showThinking={showThinking} />
                ) : (
                  <div className={`flex flex-col gap-2 px-2 rounded-lg text-sm ${msg.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-hoverbg text-foreground"
                    }`}>
                    {msg.text && (
                      <p
                        className="whitespace-pre-wrap w-full break-words"
                        dangerouslySetInnerHTML={{ __html: msg.text }}
                      />
                    )}
                    {msg.image && (
                      <img src={msg.image} alt="uploaded error" className="mt-2 max-w-full rounded-md" />
                    )}
                  </div>
                )}

                {mounted && msg.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTime(msg.createdAt instanceof Timestamp ? msg.createdAt.toDate() : new Date(msg.createdAt))}
                  </div>
                )}

                {msg.role === "bot" && mounted && msg.text && (
                  <button
                    onClick={() => handleCopy(msg.text, index)}
                    className="absolute -bottom-8 right-0 cursor-pointer opacity-100 transition-opacity p-2 rounded-md hover:bg-hoverbg"
                  >
                    {copiedIndex === index ? <Check size={14} className="text-primary" /> : <Copy size={14} className="text-muted-foreground" />}
                  </button>
                )}
              </div>

              {msg.role === "user" && <User size={20} />}
            </div>
          ))}

        </div>
      ) : (
        <div className="flex-1 p-4 space-y-4 items-center justify-center ">
          <div className="flex items-center justify-center flex-col gap-2">
            <div className="bluranimation bg-purple-800/60 rounded-full blur-2xl absolute -left-[20%] -top-[20%]" />
            <div className="bluranimation bg-blue-800/60 rounded-full blur-2xl absolute -right-[20%] -bottom-[20%]" />
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Hello <span className="animate-wave inline-block">👋</span>
            </h1>
            <p className="text-center text-gray-500">
              This is Bug Interpreter. Paste your error and learn fast with AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiRes;
