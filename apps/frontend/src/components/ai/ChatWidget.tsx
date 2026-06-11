"use client";
import { useEffect, useRef, useState } from "react";
import { tenantConfig } from "@storefront/config";
import { api, ApiError } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem("ai_session_id");
    if (existing) return existing;
    const newId = generateSessionId();
    sessionStorage.setItem("ai_session_id", newId);
    return newId;
  } catch {
    return generateSessionId();
  }
}

export function ChatWidget() {
  const { ai } = tenantConfig;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const [sessionId] = useState<string>(() =>
    typeof window === "undefined" ? "" : getOrCreateSessionId(),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const greetingShown = useRef(false);

  // Greeting + focus on open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [open]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    function handleOpenChat() {
      if (!open) {
        toggleChat();
      }
    }
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("open-ai-chat", handleOpenChat);
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || typing) return;

    const userMessage: Message = { role: "user", content: text };
    const history = messages
      .filter((m) => !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    try {
      const data = (await api.ai.chat(text, sessionId, history)) as {
        reply: string;
      };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      const isRateLimit =
        err instanceof ApiError && err.code === "RATE_LIMITED";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isRateLimit
            ? "You're sending messages too quickly. Please wait a moment."
            : "Sorry, I'm having trouble right now. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!ai.enabled) return null;

  function toggleChat() {
    setOpen((prev) => {
      const next = !prev;
      if (next && !greetingShown.current) {
        greetingShown.current = true;
        setMessages([{ role: "assistant", content: ai.greetingMessage }]);
      }
      return next;
    });
  }
  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-105 flex items-center justify-center"
        aria-label={open ? "Close chat" : `Chat with ${ai.assistantName}`}
      >
        {open ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-surface rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 max-h-[520px] ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        role="dialog"
        aria-label={`Chat with ${ai.assistantName}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-t-2xl flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
            {ai.assistantName[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{ai.assistantName}</p>
            <p className="text-xs text-white/70">AI Assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-xs text-white/70">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : msg.isError
                      ? "bg-red-50 text-red-700 rounded-bl-sm"
                      : "bg-gray-100 text-foreground rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask ${ai.assistantName}…`}
              maxLength={500}
              disabled={typing}
              className="flex-1 text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || typing}
              className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary-dark disabled:opacity-40 transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">
            Powered by AI · May make mistakes
          </p>
        </div>
      </div>
    </>
  );
}
