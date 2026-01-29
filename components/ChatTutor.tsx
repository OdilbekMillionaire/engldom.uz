import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { chatWithTutor } from '../services/geminiService';

interface ChatTutorProps {
    isOpen: boolean;
    onClose: () => void;
    context: string;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const ChatTutor: React.FC<ChatTutorProps> = ({ isOpen, onClose, context }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Hi! I'm your AI Tutor. I see your results. Do you have any specific questions about where you went wrong or how to improve?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const reply = await chatWithTutor(context, userMsg, messages);
            setMessages(prev => [...prev, { role: 'model', text: reply || "I'm having trouble connecting right now." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, something went wrong. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">AI Personal Tutor</h3>
                            <p className="text-xs text-slate-400">Context Aware • IELTS Expert</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed ${
                                m.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                             <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl rounded-bl-none shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask for clarification..."
                            className="flex-1 bg-slate-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
