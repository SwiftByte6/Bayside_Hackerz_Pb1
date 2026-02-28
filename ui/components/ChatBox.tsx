import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Trash2 } from 'lucide-react';
import { sendChatMessage } from '@/lib/api';

export default function ChatBox({ reportSummary }: { reportSummary: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Initial greeting when opened for first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: `Hi there! I'm your VibeAudit AI assistant. I've reviewed your codebase **${reportSummary?.repoName || ''}**.\n\nYour score is **${Math.round(reportSummary?.score?.score || 0)}/100** with **${reportSummary?.summary?.totalIssues || 0} issues** found.\n\nWhat would you like to know?`
            }]);
        }
    }, [isOpen, messages.length, reportSummary]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Check local storage for api key or provider if we wanted to reuse from agents pipeline
            // For now, let's default to a smart fallback
            const reply = await sendChatMessage(
                newMessages,
                reportSummary,
                'ollama', // You can hook this up to the parent's state later if you want dynamic provider
                'claude-3.5-sonnet',
                'http://localhost:11434/v1',
                ''
            );

            setMessages([...newMessages, { role: 'assistant', content: reply }]);
        } catch (error: any) {
            setMessages([...newMessages, { role: 'assistant', content: `**Error:** ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setIsOpen(false);
        setTimeout(() => setIsOpen(true), 10);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: 'fixed', bottom: 30, right: 30, zIndex: 999,
                    width: 60, height: 60, borderRadius: 30,
                    background: 'var(--cyan)', color: '#000',
                    border: 'none', cursor: 'pointer',
                    display: isOpen ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0, 217, 255, 0.4)'
                }}
            >
                <MessageSquare size={28} />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{
                            position: 'fixed', bottom: 30, right: 30, zIndex: 1000,
                            width: 380, height: 600, maxHeight: '80vh',
                            background: 'rgba(10, 10, 18, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.02)', borderRadius: '16px 16px 0 0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 16, background: 'var(--cyan-dim)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Bot size={18} color="var(--cyan)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>VibeAudit AI</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ask about your code</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={clearChat} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} title="Clear Chat">
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div style={{
                            flex: 1, overflowY: 'auto', padding: 20,
                            display: 'flex', flexDirection: 'column', gap: 16
                        }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{
                                    display: 'flex', gap: 12,
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                                        background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--cyan-dim)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {msg.role === 'user' ? <User size={14} color="var(--text-secondary)" /> : <Bot size={14} color="var(--cyan)" />}
                                    </div>
                                    <div style={{
                                        padding: '10px 14px', borderRadius: 12,
                                        background: msg.role === 'user' ? 'var(--cyan)' : 'var(--bg-secondary)',
                                        color: msg.role === 'user' ? '#000' : 'var(--text-secondary)',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                        fontSize: 13, lineHeight: 1.5,
                                        borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                                        borderTopLeftRadius: msg.role === 'assistant' ? 4 : 12,
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {/* Simple bold markdown parsing */}
                                        {msg.content.split('**').map((part, idx) =>
                                            idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Bot size={14} color="var(--cyan)" />
                                    </div>
                                    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', gap: 4 }}>
                                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--cyan)' }} />
                                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--cyan)' }} />
                                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--cyan)' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 16px 16px' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask anything about your code..."
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                        fontSize: 14, resize: 'none', outline: 'none', maxHeight: 120, minHeight: 24,
                                        fontFamily: 'var(--font-sans)', padding: '4px 0'
                                    }}
                                    rows={1}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    style={{
                                        background: input.trim() && !isLoading ? 'var(--cyan)' : 'var(--bg-secondary)',
                                        color: input.trim() && !isLoading ? '#000' : 'var(--text-muted)',
                                        border: 'none', borderRadius: 8, width: 32, height: 32,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s', marginBottom: 2
                                    }}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
                                AI can make mistakes. Check important code.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
