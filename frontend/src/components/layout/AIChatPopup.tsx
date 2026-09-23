"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Sparkles, FileSearch, Map, HelpCircle, Lightbulb, MessageSquare } from "lucide-react";
import styles from "./AIChatPopup.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { label: "Submit a paper", icon: FileSearch, prompt: "How do I submit a paper on Shaoor?" },
  { label: "Review tips", icon: Lightbulb, prompt: "What makes a good peer review?" },
  { label: "Navigate platform", icon: Map, prompt: "What pages and features are available on Shaoor?" },
  { label: "Get help", icon: HelpCircle, prompt: "What can you help me with?" },
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm the Shaoor AI assistant — powered by Gemini. I can help with paper submission, platform navigation, and peer review guidance. How can I help?",
};

export function AIChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 72) + "px";
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "AI request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, role: "assistant", content: "" },
      ]);

      if (reader) {
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, content: accumulated } : m
            )
          );
        }
      }
    } catch (err: any) {
      console.error("AI Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating popup window */}
      {isOpen && (
        <div className={styles.popup} role="dialog" aria-label="AI Assistant chat">
          {/* Header */}
          <div className={styles.popupHeader}>
            <div className={styles.popupTitle}>
              <Sparkles size={14} />
              <span>AI Assistant</span>
              <span className={styles.poweredBy}>Gemini</span>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
            >
              <X size={15} />
            </button>
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className={styles.quickAction}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className={styles.messages} aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.aiMessage}`}
              >
                {message.role === "assistant" && (
                  <div className={styles.aiAvatar}>AI</div>
                )}
                <div className={`${styles.bubble} ${message.role === "user" ? styles.userBubble : styles.aiBubble}`}>
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.aiMessage}`}>
                <div className={styles.aiAvatar}>AI</div>
                <div className={`${styles.bubble} ${styles.aiBubble}`}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <textarea
              ref={textareaRef}
              className={styles.chatInput}
              placeholder="Ask me anything…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              aria-label="Message to AI assistant"
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        id="ai-chat-fab"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </>
  );
}
