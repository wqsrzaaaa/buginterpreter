export const handleMic = ({ 
  recognitionRef, 
  recording, 
  setRecording, 
  setInput, 
  Input,
  language 
}) => {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!recognitionRef.current) {
  recognitionRef.current = new SpeechRecognition();
  recognitionRef.current.continuous = true;
  recognitionRef.current.interimResults = true;
  recognitionRef.current.finalTranscript = ""; // ✅ store here

  recognitionRef.current.onresult = (event) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        recognitionRef.current.finalTranscript +=
          (recognitionRef.current.finalTranscript ? " " : "") + transcript;

        setInput(recognitionRef.current.finalTranscript);
      } else {
        interimTranscript += transcript;
        setInput(
          recognitionRef.current.finalTranscript +
            (interimTranscript ? " " + interimTranscript : "")
        );
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
  recognitionRef.current.finalTranscript = Input.trim();

  recognitionRef.current.lang = language.code;
  recognitionRef.current.start();
  setRecording(true);
}

};
