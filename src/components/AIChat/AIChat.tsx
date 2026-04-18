/**
 * AIChat Component - Floating AI assistant chat widget
 * 支持阿里云通义千问 API
 */

import { useState, useRef, useEffect } from 'react';
import styles from './AIChat.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 通义千问 API 配置
const QWEN_API_URL = '/api/qwen/api/v1/services/aigc/text-generation/generation';

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('qwen_api_key') || '';
  });
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save API key to localStorage
  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('qwen_api_key', key);
    setShowSettings(false);
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([]);
  };

  // Send message to Qwen API
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 构建对话历史
      const chatHistory = [];
      for (const msg of messages) {
        chatHistory.push({
          role: msg.role,
          content: msg.content,
        });
      }
      chatHistory.push({
        role: 'user',
        content: userMessage.content,
      });

      const response = await fetch(QWEN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: {
            messages: chatHistory,
          },
          parameters: {
            max_tokens: 1024,
            temperature: 0.7,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.code) {
        throw new Error(data.message || data.error?.message || `请求失败 (${response.status})`);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.output?.text || '抱歉，我没有理解您的问题。',
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : '未知错误';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ 错误: ${errorText}\n\n请检查:\n1. API Key 是否正确\n2. 是否已开通通义千问服务\n3. 账户是否有余额`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.headerIcon}>🤖</span>
              <span>AI 助手</span>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.headerBtn}
                onClick={clearChat}
                title="清空对话"
              >
                🗑️
              </button>
              <button
                className={styles.headerBtn}
                onClick={() => setShowSettings(!showSettings)}
                title="设置"
              >
                ⚙️
              </button>
              <button
                className={styles.headerBtn}
                onClick={() => setIsOpen(false)}
                title="关闭"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className={styles.settingsPanel}>
              <label className={styles.settingsLabel}>
                通义千问 API Key
                <input
                  type="password"
                  className={styles.settingsInput}
                  placeholder="输入您的 API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveApiKey(apiKey);
                    }
                  }}
                />
              </label>
              <div className={styles.settingsActions}>
                <button
                  className={styles.settingsSaveBtn}
                  onClick={() => saveApiKey(apiKey)}
                >
                  保存
                </button>
                <a
                  href="https://dashscope.console.aliyun.com/apiKey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.settingsLink}
                >
                  获取免费 API Key →
                </a>
              </div>
              <div className={styles.settingsHint}>
                新用户免费额度 100 万 tokens
              </div>
            </div>
          )}

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <div className={styles.welcomeIcon}>🎵</div>
                <div className={styles.welcomeText}>
                  你好！我是你的AI音乐助手 🎧
                  <br />
                  有什么可以帮你的吗？
                </div>
                {!apiKey && (
                  <div className={styles.welcomeHint}>
                    点击 ⚙️ 设置通义千问 API Key
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${
                    msg.role === 'user' ? styles.userMessage : styles.assistantMessage
                  }`}
                >
                  <div className={styles.messageAvatar}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={styles.messageContent}>{msg.content}</div>
                </div>
              ))
            )}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageAvatar}>🤖</div>
                <div className={styles.typing}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <input
              type="text"
              className={styles.input}
              placeholder={apiKey ? '输入消息...' : '请先设置 API Key...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !apiKey}
            />
            <button
              className={styles.sendBtn}
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !apiKey}
            >
              {isLoading ? '...' : '发送'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`${styles.floatingBtn} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI 助手"
      >
        {isOpen ? (
          <span className={styles.closeIcon}>✕</span>
        ) : (
          <svg
            className={styles.robotIcon}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Robot head */}
            <rect x="12" y="16" width="40" height="36" rx="8" fill="currentColor" />
            {/* Antenna */}
            <circle cx="32" cy="8" r="4" fill="currentColor" />
            <rect x="30" y="8" width="4" height="8" fill="currentColor" />
            {/* Eyes */}
            <circle cx="24" cy="30" r="5" fill="#0a0a0a" />
            <circle cx="40" cy="30" r="5" fill="#0a0a0a" />
            <circle cx="25" cy="29" r="2" fill="#00ff00" />
            <circle cx="41" cy="29" r="2" fill="#00ff00" />
            {/* Mouth */}
            <rect x="24" y="40" width="16" height="4" rx="2" fill="#0a0a0a" />
            {/* Ears */}
            <rect x="6" y="24" width="6" height="12" rx="3" fill="currentColor" />
            <rect x="52" y="24" width="6" height="12" rx="3" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}
