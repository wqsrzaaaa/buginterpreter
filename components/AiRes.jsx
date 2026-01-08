import React from "react";
import LoaderAI from "./LoaderAI";
import { Timestamp } from "firebase/firestore";
import { Check, Copy, User } from "lucide-react";
import Image from "next/image";

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
  setzoom,
  setglobleimg
}) => {

  return (
    <div
      ref={messagesContainerRef}
      className={`flex-1  overflow-y-auto custom-scrollbar ${messages.length > 1 ? 'p-4' : 'p-0'}`}
    >
      {messages.length > 1 ? (
        messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "bot" && <Bot size={20} />}

            <div
              className={`relative group px-4 py-2 mb-7 rounded-lg max-w-[70%] w-auto text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-hoverbg text-foreground"
                } shadow`}
            >
              {msg.image && (
                <Image
                  width={34}
                  height={34}
                  src={msg.image}
                  alt="uploaded error"
                  onClick={() => (setzoom(true), setglobleimg(msg.image))}
                  className="mt-2 w-34 h-fit my-3 object-contain rounded-sm "
                />
              )}
              {msg.role === "bot" && isLoading && index === messages.length - 1 ? (
                <LoaderAI showThinking={showThinking} />
              ) : (
                <div className="flex flex-col gap-4">
                  {msg.data ? (
                    msg.data.rootCause ? (
                      <>

                      <div className="p-3 border-b border-border py-6">
                          <p className="font-bold text-xl">‼️ Error type</p>
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.data.errorType}
                          </p>
                        </div>
                        <div className="p-3 border-b border-border py-6">
                          <p className="font-bold text-xl">❌ What Went Wrong</p>
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.data.rootCause}
                          </p>
                        </div>

                        {msg.data.location?.file && (
                          <div className="p-3 rounded border-b">
                            <p className="font-bold text-xl">📍 Location</p>
                            <p className="text-sm italic">
                              {`${msg.data.location.file}:${msg.data.location.line ?? ""}`}
                            </p>
                          </div>
                        )}

                        {msg.data.fixes?.length > 0 && (
                          <div className="p-3 rounded border-b flex flex-col gap-2">
                            <p className="font-bold text-xl">✅ Fixes</p>
                            {msg.data.fixes.map((fix, fIndex) => (
                              <div key={fIndex} className="mt-2 flex flex-col gap-6">
                                <p className="font-semibold">
                                  {` ${fIndex + 1}.  Fix ${fIndex + 1}`}  <span className="font-light">({fix.type})</span>
                                </p>
                                <pre className="bg-cardbg text-green-300 p-3 rounded overflow-x-auto font-mono text-xs">
                                  {fix.patch}
                                </pre>
                                <div className="text-xl">
                                  <b>Explanation: </b> 
                                  <span className="text-sm font-light">{fix.explanation.advanced}</span>
                                </div>

                                <div className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/30 text-muted-foreground  mb-6">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <p className="text-xs font-medium tracking-tight">
                                    Confidence: {fix.confidence * 100}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.data.diagnosticSteps?.length > 0 && (
                          <div className="p-3 rounded border-b border-border py-6">
                            <h2 className="font-bold text-xl pb-2">🧪 Diagnostic Steps</h2>
                            <ul className="list-disc list-inside text-sm">
                              {msg.data.diagnosticSteps.map((step, i) => (
                                <li className="py-2"
                                  key={i}
                                  dangerouslySetInnerHTML={{
                                    __html: step.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
                                  }}
                                />
                              ))}
                            </ul>
                          </div>
                        )}

                        {msg.data.followUpQuestions?.length > 0 && (
                          <div className="p-3 rounded border-b border-border py-6">
                            <h2 className="font-bold text-xl pb-2">❓ Following up questions</h2>
                            <ul className="list-disc list-inside text-sm">
                              {msg.data.followUpQuestions.map((step, i) => (
                                <li className="py-2"
                                  key={i}
                                  dangerouslySetInnerHTML={{
                                    __html: step.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
                                  }}
                                />
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      /* ✅ Gemini plain message */
                      <p className="whitespace-pre-wrap w-full break-words">
                        {msg.data.message}
                      </p>
                    )
                  ) : (
                    /* fallback */
                    <p className="whitespace-pre-wrap w-full break-words">
                      {msg.text}
                    </p>
                  )}
                </div>
              )}

              {mounted && msg.createdAt && (
                <div className="text-xs text-zinc-400 mt-1">
                  {formatTime(msg.createdAt instanceof Timestamp ? msg.createdAt.toDate() : new Date(msg.createdAt))}
                </div>
              )}

              {msg.role === "bot" && mounted && (msg.text || msg.data) && (
                <button
                  onClick={() => handleCopy(msg.text || JSON.stringify(msg.data, null, 2), index)}
                  className="absolute -bottom-10 right-0 cursor-pointer opacity-100  transition-opacity p-2 rounded-md hover:bg-hoverbg"
                >
                  {copiedIndex === index ? <div className="flex items-center gap-1 text-cardbg"> <Check size={14} className="text-green-600" /> Copied</div> : (<div className="flex items-center gap-1 text-cardbg"> <Copy size={14} className="text-zinc-400" /> Copy</div>)}
                </button>
              )}
            </div>

            {msg.role === "user" && <User size={20} />}
          </div>
        ))
      ) : (
        <div className="flex-1 overflow-hidden w-full h-[77vh] items-center justify-center">
          <div className="flex items-center justify-center h-full flex-col gap-2 relative">
            <div className="bluranimation bg-purple-900/60 rounded-full blur-2xl absolute -left-[20%] top-[20%]" />
            <div className="bluranimation bg-blue-900/40 rounded-full blur-2xl absolute -right-[20%] bottom-[80]" />
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Hello <span className="animate-wave inline-block">👋</span>
            </h1>
            <p className="text-center text-zinc-500">
              This is Bug Interpreter. Paste your error and learn fast with AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiRes;
