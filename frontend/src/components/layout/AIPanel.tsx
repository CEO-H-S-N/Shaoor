"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Sparkles, FileSearch, Map, HelpCircle, Lightbulb } from "lucide-react";
import styles from "./AIPanel.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { label: "Summarize paper", icon: FileSearch, prompt: "Summarize the current paper for me in 3 bullet points." },
  { label: "Navigate platform", icon: Map, prompt: "How do I submit a paper on Shaoor?" },
  { label: "Review tips", icon: Lightbulb, prompt: "What makes a good peer review?" },
  { label: "Get help", icon: HelpCircle, prompt: "What can you help me with?" },
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm the Shaoor AI assistant. I can summarize papers, help you navigate the platform, and answer questions about the review process. How can I help?",
};

export function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 80) + "px";
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

      if (!response.ok) throw new Error("AI request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Stream the response
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          aiMessage.content += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMessage.id ? { ...aiMessage } : m))
          );
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
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
    <div className={`${styles.panel}`}>
      {/* ─── Header ──────────────────────────────────────── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span className={styles.aiDot} />
          <div>
            <div className={styles.panelTitleText}>
              <Sparkles size={14} style={{ display: "inline", marginRight: 4 }} />
              AI Assistant
            </div>
            <div className={styles.panelTitleSub}>Powered by Gemini</div>
          </div>
        </div>
        <button
          className={styles.closeBtn}
          onClick={() => setIsPanelOpen(false)}
          aria-label="Close AI panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* ─── Quick Actions ────────────────────────────────── */}
      <div className={styles.quickActions}>
        <span className={styles.quickActionsLabel}>Quick actions</span>
        <div className={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              className={styles.quickAction}
              onClick={() => sendMessage(action.prompt)}
              disabled={isLoading}
            >
              <action.icon className={styles.quickActionIcon} size={14} />
              <span className={styles.quickActionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────── */}
      <div className={styles.messages} aria-live="polite" aria-label="AI conversation">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.role === "user" ? styles.userMessage : ""}`}
          >
            <div
              className={`${styles.messageAvatar} ${message.role === "assistant" ? styles.aiAvatar : styles.userAvatar}`}
            >
              {message.role === "assistant" ? "AI" : "U"}
            </div>
            <div
              className={`${styles.messageBubble} ${message.role === "assistant" ? styles.aiBubble : styles.userBubble}`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={styles.message}>
            <div className={`${styles.messageAvatar} ${styles.aiAvatar}`}>AI</div>
            <div className={styles.typing}>
              <div className={styles.typingDot} />
              <div className={styles.typingDot} />
              <div className={styles.typingDot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input ────────────────────────────────────────── */}
      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
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
            <Send size={14} />
          </button>
        </div>
        <p className={styles.inputHint}>Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
