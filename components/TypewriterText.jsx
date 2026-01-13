'use client'
import { useEffect, useState } from "react";

// We store keys globally to ensure animation runs only once
const runOnceStore = {};

export default function TypewriterText({ text, speed = 3, runOnceKey, onDone }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    // If a key is provided and it already ran, just show full text
    if (runOnceKey && runOnceStore[runOnceKey]) {
      setDisplayed(text);
      return;
    }

    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(prev => prev + text[i]);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        // Mark as done in the global store
        if (runOnceKey) runOnceStore[runOnceKey] = true;
        onDone?.();
      }
    }, speed);

    return () => clearInterval(interval);

    // Only run on mount or when text changes
  }, [text, speed, runOnceKey]);

  return <p className="whitespace-pre-wrap">{displayed}</p>;
}
