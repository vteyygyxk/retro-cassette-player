/**
 * AIChat Component - Floating AI assistant chat widget
 * 支持阿里云通义千问 API，可以解析用户意图并播放歌曲
 * 支持语音输入（讯飞语音识别，国内可用）
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import type { XunfeiConfig } from '../../hooks/useSpeechRecognition';
import styles from './AIChat.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  /** 当前播放的歌曲名称 */
  currentTrackName?: string;
  /** 当前播放的歌手 */
  currentArtist?: string;
  /** 播放歌曲的回调 */
  onPlaySong?: (songName: string, artist?: string) => Promise<boolean>;
  /** 随机播放的回调 */
  onRandomPlay?: () => Promise<boolean>;
}

// 通义千问 API 配置
const QWEN_API_URL = '/api/qwen/api/v1/services/aigc/text-generation/generation';

// 系统提示词
const SYSTEM_PROMPT = `你是一个友好的AI音乐助手，专门帮助用户发现和播放音乐。

## 核心能力
1. **播放歌曲**: 当用户说想听某首歌时，你可以帮他们播放
2. **推荐音乐**: 根据用户喜好推荐歌曲
3. **音乐知识**: 解答关于音乐、歌手、歌曲的问题

## 播放歌曲的规则
当用户想听歌时，你需要返回特殊格式的JSON指令：

### 播放指定歌曲
\`\`\`json
{"action": "play", "song": "歌曲名", "artist": "歌手名"}
\`\`\`

### 随机播放
\`\`\`json
{"action": "random"}
\`\`\`

## 示例对话
用户: "我想听周杰伦的稻香"
助手: 好的，为你播放周杰伦的《稻香》🎶
\`\`\`json
{"action": "play", "song": "稻香", "artist": "周杰伦"}
\`\`\`

用户: "放首歌"
助手: 好的，为你随机播放一首歌 🎵
\`\`\`json
{"action": "random"}
\`\`\`

用户: "来首欢快的歌"
助手: 好的，为你播放一首欢快的歌！
\`\`\`json
{"action": "play", "song": "小幸运", "artist": "田馥甄"}
\`\`\`

## 重要规则
1. JSON指令必须放在单独的代码块中，格式为 \`\`\`json ... \`\`\`
2. 每次只能返回一个JSON指令
3. 如果用户没有明确指定歌曲，可以根据情境推荐并播放
4. 回答要简洁有趣，偶尔可以用音乐相关的表情符号
5. 如果用户问的是音乐知识问题而非播放请求，正常回答即可，不需要返回JSON`;

// 解析AI响应中的JSON指令
function parseActionFromResponse(content: string): { action: string; song?: string; artist?: string } | null {
  const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      return null;
    }
  }

  const directJsonMatch = content.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
  if (directJsonMatch) {
    try {
      return JSON.parse(directJsonMatch[0]);
    } catch {
      return null;
    }
  }

  return null;
}

// 清理响应内容中的JSON代码块
function cleanResponseContent(content: string): string {
  return content.replace(/```json\s*\{[\s\S]*?\}\s*```/g, '').trim();
}

export function AIChat({
  currentTrackName,
  currentArtist,
  onPlaySong,
  onRandomPlay,
}: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('qwen_api_key') || '';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'qwen' | 'xunfei'>('qwen');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 语音识别回调
  const handleSpeechResult = useCallback((transcript: string) => {
    console.log('[AIChat] handleSpeechResult called with:', transcript);
    if (transcript.trim() && apiKey) {
      setInput(transcript);
      setTimeout(() => {
        sendMessageWithText(transcript);
      }, 300);
    } else {
      console.log('[AIChat] transcript empty or no apiKey, transcript:', transcript, 'apiKey:', !!apiKey);
    }
  }, [apiKey]);

  // 语音识别Hook
  const {
    state: speechState,
    isConfigured: isSpeechConfigured,
    error: speechError,
    xunfeiConfig,
    saveConfig: saveXunfeiConfig,
    toggleListening,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
  });

  // 讯飞配置表单状态
  const [xunfeiForm, setXunfeiForm] = useState<XunfeiConfig>({
    appId: '',
    apiKey: '',
    apiSecret: '',
  });

  // 初始化讯飞配置表单
  useEffect(() => {
    if (xunfeiConfig) {
      setXunfeiForm(xunfeiConfig);
    }
  }, [xunfeiConfig]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save API key to localStorage
  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('qwen_api_key', key);
  };

  // Save Xunfei config
  const handleSaveXunfeiConfig = () => {
    if (xunfeiForm.appId && xunfeiForm.apiKey && xunfeiForm.apiSecret) {
      saveXunfeiConfig(xunfeiForm);
    }
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([]);
  };

  // Execute play action
  const executeAction = useCallback(async (action: { action: string; song?: string; artist?: string }) => {
    if (action.action === 'play' && action.song && onPlaySong) {
      const success = await onPlaySong(action.song, action.artist);
      return success ? `已为你播放《${action.song}》${action.artist ? ` - ${action.artist}` : ''} 🎵` : `抱歉，没有找到《${action.song}》，请换个关键词试试`;
    } else if (action.action === 'random' && onRandomPlay) {
      const success = await onRandomPlay();
      return success ? '正在为你随机播放一首歌 🎶' : '随机播放失败，请稍后重试';
    }
    return null;
  }, [onPlaySong, onRandomPlay]);

  // Send message with specific text
  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = [];

      let systemContent = SYSTEM_PROMPT;
      if (currentTrackName) {
        systemContent += `\n\n## 当前播放状态\n用户正在播放：${currentTrackName}${currentArtist ? ` - ${currentArtist}` : ''}`;
      } else {
        systemContent += '\n\n## 当前播放状态\n用户当前没有播放任何歌曲';
      }

      chatHistory.push({ role: 'system', content: systemContent });

      const recentMessages = messages.slice(-10);
      for (const msg of recentMessages) {
        chatHistory.push({ role: msg.role, content: msg.content });
      }
      chatHistory.push({ role: 'user', content: userMessage.content });

      const response = await fetch(QWEN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: { messages: chatHistory },
          parameters: { max_tokens: 1024, temperature: 0.7 },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.code) {
        throw new Error(data.message || data.error?.message || `请求失败 (${response.status})`);
      }

      const rawContent = data.output?.text || '抱歉，我没有理解您的问题。';
      console.log('[AI] Raw response:', rawContent);
      const action = parseActionFromResponse(rawContent);
      let finalContent = cleanResponseContent(rawContent);
      console.log('[AI] Final content:', finalContent);

      if (action) {
        const actionResult = await executeAction(action);
        if (actionResult) {
          finalContent = finalContent ? `${finalContent}\n\n${actionResult}` : actionResult;
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent || rawContent,
      }]);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : '未知错误';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ 错误: ${errorText}\n\n请检查:\n1. API Key 是否正确\n2. 是否已开通通义千问服务\n3. 账户是否有余额`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    await sendMessageWithText(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceClick = () => {
    if (!isSpeechConfigured) {
      setShowSettings(true);
      setActiveSettingsTab('xunfei');
      return;
    }
    if (!apiKey) {
      setShowSettings(true);
      setActiveSettingsTab('qwen');
      return;
    }
    toggleListening();
  };

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.headerIcon}>🤖</span>
              <span>AI 音乐助手</span>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.headerBtn} onClick={clearChat} title="清空对话">🗑️</button>
              <button className={styles.headerBtn} onClick={() => setShowSettings(!showSettings)} title="设置">⚙️</button>
              <button className={styles.headerBtn} onClick={() => setIsOpen(false)} title="关闭">✕</button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className={styles.settingsPanel}>
              {/* Tabs */}
              <div className={styles.settingsTabs}>
                <button
                  className={`${styles.settingsTab} ${activeSettingsTab === 'qwen' ? styles.active : ''}`}
                  onClick={() => setActiveSettingsTab('qwen')}
                >
                  通义千问
                </button>
                <button
                  className={`${styles.settingsTab} ${activeSettingsTab === 'xunfei' ? styles.active : ''}`}
                  onClick={() => setActiveSettingsTab('xunfei')}
                >
                  语音识别
                </button>
              </div>

              {/* Qwen Settings */}
              {activeSettingsTab === 'qwen' && (
                <div className={styles.settingsContent}>
                  <label className={styles.settingsLabel}>
                    API Key
                    <input
                      type="password"
                      className={styles.settingsInput}
                      placeholder="输入您的通义千问 API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </label>
                  <div className={styles.settingsActions}>
                    <button className={styles.settingsSaveBtn} onClick={() => saveApiKey(apiKey)}>保存</button>
                    <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank" rel="noopener noreferrer" className={styles.settingsLink}>
                      获取免费 API Key →
                    </a>
                  </div>
                </div>
              )}

              {/* Xunfei Settings */}
              {activeSettingsTab === 'xunfei' && (
                <div className={styles.settingsContent}>
                  <label className={styles.settingsLabel}>
                    AppID
                    <input
                      type="text"
                      className={styles.settingsInput}
                      placeholder="讯飞 AppID"
                      value={xunfeiForm.appId}
                      onChange={(e) => setXunfeiForm({ ...xunfeiForm, appId: e.target.value })}
                    />
                  </label>
                  <label className={styles.settingsLabel}>
                    API Key
                    <input
                      type="password"
                      className={styles.settingsInput}
                      placeholder="讯飞 API Key"
                      value={xunfeiForm.apiKey}
                      onChange={(e) => setXunfeiForm({ ...xunfeiForm, apiKey: e.target.value })}
                    />
                  </label>
                  <label className={styles.settingsLabel}>
                    API Secret
                    <input
                      type="password"
                      className={styles.settingsInput}
                      placeholder="讯飞 API Secret"
                      value={xunfeiForm.apiSecret}
                      onChange={(e) => setXunfeiForm({ ...xunfeiForm, apiSecret: e.target.value })}
                    />
                  </label>
                  <div className={styles.settingsActions}>
                    <button
                      className={styles.settingsSaveBtn}
                      onClick={handleSaveXunfeiConfig}
                      disabled={!xunfeiForm.appId || !xunfeiForm.apiKey || !xunfeiForm.apiSecret}
                    >
                      保存
                    </button>
                    <a href="https://console.xfyun.cn/services/iat" target="_blank" rel="noopener noreferrer" className={styles.settingsLink}>
                      讯飞控制台 →
                    </a>
                  </div>
                  <div className={styles.settingsHint}>
                    {isSpeechConfigured ? '✅ 语音识别已配置' : '请配置讯飞语音识别（每日500次免费）'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <div className={styles.welcomeIcon}>🎵</div>
                <div className={styles.welcomeText}>
                  你好！我是你的AI音乐助手 🎧
                  <br /><br />
                  <span className={styles.welcomeExamples}>
                    试着对我说：
                    <br />• "我想听周杰伦的歌"
                    <br />• "放一首稻香"
                    <br />• "随机播放一首歌"
                  </span>
                </div>
                {(!apiKey || !isSpeechConfigured) && (
                  <div className={styles.welcomeHint}>
                    点击 ⚙️ 完成配置后开始使用
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                >
                  <div className={styles.messageAvatar}>{msg.role === 'user' ? '👤' : '🤖'}</div>
                  <div className={styles.messageContent}>{msg.content}</div>
                </div>
              ))
            )}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageAvatar}>🤖</div>
                <div className={styles.typing}><span></span><span></span><span></span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <button
              className={`${styles.voiceBtn} ${speechState === 'listening' ? styles.listening : ''}`}
              onClick={handleVoiceClick}
              disabled={isLoading}
              title={speechState === 'listening' ? '点击停止' : '语音输入'}
            >
              {speechState === 'listening' ? (
                <span className={styles.voiceWaves}><span></span><span></span><span></span><span></span></span>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.micIcon}>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
            <input
              type="text"
              className={styles.input}
              placeholder={apiKey ? '说你想听的歌...' : '请先设置 API Key...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !apiKey}
            />
            <button className={styles.sendBtn} onClick={sendMessage} disabled={isLoading || !input.trim() || !apiKey}>
              {isLoading ? '...' : '发送'}
            </button>
          </div>

          {speechError && <div className={styles.speechError}>{speechError}</div>}
        </div>
      )}

      {/* Floating Button */}
      <button className={`${styles.floatingBtn} ${isOpen ? styles.active : ''}`} onClick={() => setIsOpen(!isOpen)} title="AI 音乐助手">
        {isOpen ? (
          <span className={styles.closeIcon}>✕</span>
        ) : (
          <svg className={styles.robotIcon} viewBox="0 0 64 64" fill="none">
            <rect x="12" y="16" width="40" height="36" rx="8" fill="currentColor" />
            <circle cx="32" cy="8" r="4" fill="currentColor" />
            <rect x="30" y="8" width="4" height="8" fill="currentColor" />
            <circle cx="24" cy="30" r="5" fill="#0a0a0a" />
            <circle cx="40" cy="30" r="5" fill="#0a0a0a" />
            <circle cx="25" cy="29" r="2" fill="#00ff00" />
            <circle cx="41" cy="29" r="2" fill="#00ff00" />
            <rect x="24" y="40" width="16" height="4" rx="2" fill="#0a0a0a" />
            <rect x="6" y="24" width="6" height="12" rx="3" fill="currentColor" />
            <rect x="52" y="24" width="6" height="12" rx="3" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}
