import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { saveMessage, loadChatHistory, deleteAllMessages } from "./firebase/chatService";

function App() {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  const getCurrentTimestamp = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchChatHistory = async () => {
    setLoadingHistory(true);
    const history = await loadChatHistory();
    setChatHistory(history);
    setLoadingHistory(false);
  };

  const generateAnswer = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const newQuestion = {
      type: "question",
      content: question.trim(),
      timestamp: getCurrentTimestamp(),
    };

    const updatedHistory = [...chatHistory, newQuestion];
    setChatHistory(updatedHistory);
    setQuestion("");
    setGeneratingAnswer(true);
    await saveMessage(newQuestion);

    const contextMessages = [
      {
        role: "user",
        parts: [{ text: "You are a helpful assistant. Always give short and concise responses unless asked for detailed explanation." }]
      },
      ...updatedHistory.map((item) => ({
        role: item.type === "question" ? "user" : "model",
        parts: [{ text: item.content }],
      }))
    ];


    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT}`,
        { contents: contextMessages }
      );

      const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      const aiReply = {
        type: "answer",
        content: aiText,
        timestamp: getCurrentTimestamp(),
      };

      setChatHistory((prev) => [...prev, aiReply]);
      await saveMessage(aiReply);
    } catch (error) {
      const errReply = {
        type: "answer",
        content: "❌ Error generating response.",
        timestamp: getCurrentTimestamp(),
      };
      setChatHistory((prev) => [...prev, errReply]);
      await saveMessage(errReply);
    } finally {
      setGeneratingAnswer(false);
    }
  };

  const clearChat = () => {
    const confirmClear = window.confirm("Are you sure you want to clear chat view?");
    if (!confirmClear) return;
    setChatHistory([]);
  };

  return (
    <div className="min-h-screen font-inter bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-screen">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold text-blue-700 dark:text-blue-300">AI ChatBot💬</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={clearChat}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm shadow-md transition"
            >
              🗑️ Clear Chat
            </button>
            <button
              onClick={fetchChatHistory}
              className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm shadow-md transition"
            >
              🔄 Load History
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full shadow-sm border border-gray-300 dark:border-gray-600 hover:scale-105 transition"
            >
              <span className="text-lg">{darkMode ? "🌙" : "☀️"}</span>
              <div
                className={`w-10 h-5 flex items-center bg-gray-300 dark:bg-gray-600 rounded-full px-1 transition-all duration-300 ${darkMode ? "justify-end" : "justify-start"}`}
              >
                <div className="bg-white w-3.5 h-3.5 rounded-full shadow-md"></div>
              </div>
            </button>
          </div>
        </div>

        {loadingHistory && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-300">
            🔄 Loading chat history...
          </div>
        )}

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-white/60 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-6 space-y-4 shadow-xl"
        >
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-300">
              Ask something to get started!
            </div>
          ) : (
            chatHistory.map((chat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${chat.type === "question" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-sm px-4 py-3 rounded-xl text-sm shadow-md break-words relative ${chat.type === "question"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none"
                    }`}
                >
                  <ReactMarkdown
                    className="prose dark:prose-invert max-w-full text-sm break-words"
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const [copied, setCopied] = useState(false);

                        if (inline) {
                          return (
                            <code
                              className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded font-mono text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }

                        const handleCopy = () => {
                          navigator.clipboard.writeText(children);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        };

                        return (
                          <div className="relative group">
                            <button
                              onClick={handleCopy}
                              className="absolute top-2 right-2 text-xs bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 px-2 py-0.5 rounded z-10"
                            >
                              {copied ? "Copied" : "Copy"}
                            </button>
                            <pre className="overflow-x-auto bg-gray-200 dark:bg-gray-800 p-3 pr-14 rounded text-xs whitespace-pre-wrap">
                              <code {...props} className="font-mono">
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      },
                    }}
                  >
                    {chat.content}
                  </ReactMarkdown>


                  <div className="text-[10px] text-right text-gray-400 dark:text-gray-300 mt-1">
                    {chat.timestamp}
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {generatingAnswer && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-xl flex gap-1 items-center">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-150">.</span>
                <span className="animate-bounce delay-300">.</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={generateAnswer} className="relative mt-4">
          <TextareaAutosize
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            minRows={1}
            maxRows={6}
            placeholder="Type your message..."
            className="w-full pr-12 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none px-4 py-3 resize-none text-sm shadow-md transition-all duration-200"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generateAnswer(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={generatingAnswer}
            className={`absolute bottom-2.5 right-3 p-2 rounded-full transition ${generatingAnswer
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            <ArrowUp className="w-3.5 h-3.5 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
