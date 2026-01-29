import React, { useState, useRef, useEffect } from 'react';
import { 
    Mic, MessageSquare, Play, Pause, Award, Volume2, 
    AudioLines, RefreshCw, ChevronRight, Zap, Brain, 
    Activity, StopCircle, Sparkles, Mic2, AlertCircle, ArrowRight 
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { generateLingifyContent, generateSpeech } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { ModuleType, SpeakingLessonResponse, SpeakingEvalResponse } from '../types';
import { ChatTutor } from './ChatTutor';

// Helper to decode raw PCM (24kHz, 16-bit, Mono) from Gemini
const decodePCMAudio = (base64Data: string, ctx: AudioContext): AudioBuffer => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert Uint8Array bytes to Int16Array (16-bit PCM)
    const pcm16 = new Int16Array(bytes.buffer);
    
    // Create AudioBuffer: Gemini TTS is 24kHz mono
    const buffer = ctx.createBuffer(1, pcm16.length, 24000);
    const channelData = buffer.getChannelData(0);
    
    // Convert to Float32 [-1.0, 1.0]
    for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
    }
    
    return buffer;
};

interface SpeakingModuleProps {
    initialData?: SpeakingLessonResponse | SpeakingEvalResponse;
}

export const SpeakingModule: React.FC<SpeakingModuleProps> = ({ initialData }) => {
  // Navigation & State
  const [activeTab, setActiveTab] = useState<'practice' | 'evaluate'>('practice');
  const [loading, setLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null); // ID of currently playing audio
  
  // Data State
  const [lessonData, setLessonData] = useState<SpeakingLessonResponse | null>(null);
  const [evalData, setEvalData] = useState<SpeakingEvalResponse | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Audio Context for Visualizer & Playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Restore State Effect
  useEffect(() => {
    if (initialData) {
        if (initialData.type === 'lesson') {
            setLessonData(initialData as SpeakingLessonResponse);
            setActiveTab('practice');
        } else if (initialData.type === 'evaluation') {
            setEvalData(initialData as SpeakingEvalResponse);
            setActiveTab('evaluate');
        }
    }
  }, [initialData]);

  // --- Handlers ---

  const handlePlayTTS = async (text: string, id: string) => {
      // Stop any current playback
      if (playbackSourceRef.current) {
          try { playbackSourceRef.current.stop(); } catch(e) {}
          playbackSourceRef.current = null;
      }

      if (audioPlaying === id) {
          setAudioPlaying(null);
          return;
      }
      
      try {
          setAudioPlaying(id);
          const base64 = await generateSpeech(text, 'Fenrir'); // "Fenrir" is good for authoritative examiner
          
          // Ensure AudioContext is running
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
          }

          const buffer = decodePCMAudio(base64, audioContextRef.current);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          
          source.onended = () => {
              setAudioPlaying(null);
              playbackSourceRef.current = null;
          };

          source.start();
          playbackSourceRef.current = source;
      } catch (e) {
          console.error(e);
          setAudioPlaying(null);
          alert("Could not play audio.");
      }
  };

  const startLesson = async () => {
    setLoading(true);
    setLessonData(null);
    try {
      const res = await generateLingifyContent<SpeakingLessonResponse>(ModuleType.SPEAKING, { mode: 'lesson' });
      setLessonData(res);
    } catch (e) {
      alert("Failed to generate lesson");
    } finally {
      setLoading(false);
    }
  };

  // --- Recording & Visualization Logic ---

  const drawVisualizer = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
          if (!isRecording) return;
          animationFrameRef.current = requestAnimationFrame(draw);
          analyserRef.current!.getByteFrequencyData(dataArray);

          canvasCtx.fillStyle = '#f8fafc'; // Match bg
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
              barHeight = dataArray[i] / 2;
              canvasCtx.fillStyle = `rgb(${barHeight + 100}, 99, 235)`; // Indigo shade
              canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
              x += barWidth + 1;
          }
      };
      draw();
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup Audio Context if not exists
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const audioCtx = audioContextRef.current;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioBlob(blob);
            setAudioUrl(URL.createObjectURL(blob));
            stream.getTracks().forEach(track => track.stop());
            cancelAnimationFrame(animationFrameRef.current);
            // Don't close audioContextRef here as we need it for playback
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        
        // Start Visualizer
        setTimeout(drawVisualizer, 100);

    } catch (err) {
        alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  useEffect(() => {
      let interval: number;
      if (isRecording) {
          interval = window.setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      }
      return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
      // Cleanup on unmount
      return () => {
          if (playbackSourceRef.current) playbackSourceRef.current.stop();
          if (audioContextRef.current) audioContextRef.current.close();
      };
  }, []);

  const formatDuration = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeAudio = async () => {
    if (!audioBlob) return;
    setLoading(true);
    try {
      // Helper to convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          const res = await generateLingifyContent<SpeakingEvalResponse>(
              ModuleType.SPEAKING, 
              { mode: 'evaluation' }, 
              { mimeType: 'audio/webm', data: base64Audio }
          );
          setEvalData(res);
          
          // Save scores
          const scores = Object.values(res.scores);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          storageService.saveProgress({
              module: ModuleType.SPEAKING,
              score: Number(avg.toFixed(1)),
              maxScore: 9,
              label: 'Speaking Evaluation'
          });
          storageService.saveActivity(ModuleType.SPEAKING, res);
          setLoading(false);
      };
    } catch (e) {
      alert("Analysis failed.");
      setLoading(false);
    }
  };

  // Helper for Radar Chart Data
  const getRadarData = () => {
      if (!evalData) return [];
      return [
          { subject: 'Fluency', A: evalData.scores.fluency, fullMark: 9 },
          { subject: 'Grammar', A: evalData.scores.grammar, fullMark: 9 },
          { subject: 'Vocab', A: evalData.scores.vocab, fullMark: 9 },
          { subject: 'Coherence', A: evalData.scores.coherence, fullMark: 9 },
          { subject: 'Pronunciation', A: evalData.scores.pronunciation, fullMark: 9 },
      ];
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 font-serif flex items-center gap-3">
                    <Mic2 className="w-8 h-8 text-indigo-600" />
                    Speaking Studio
                </h1>
                <p className="text-slate-500 mt-1">Real-time pronunciation analysis and IELTS simulation.</p>
            </div>
            
            <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                    onClick={() => setActiveTab('practice')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'practice' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MessageSquare className="w-4 h-4" /> Practice Mode
                </button>
                <button
                    onClick={() => setActiveTab('evaluate')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'evaluate' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Activity className="w-4 h-4" /> Evaluation
                </button>
            </div>
        </div>

        {/* --- PRACTICE MODE (Lesson) --- */}
        {activeTab === 'practice' && (
            <div className="space-y-6">
                {!lessonData ? (
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 text-white text-center shadow-xl">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <Sparkles className="w-10 h-10 text-yellow-300" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">IELTS Topic Generator</h2>
                        <p className="text-indigo-100 max-w-lg mx-auto mb-8 text-lg">
                            Simulate Part 1, 2, and 3 of the speaking exam. Generate random topic cards, practice answering, and listen to model responses.
                        </p>
                        <button 
                            onClick={startLesson} 
                            disabled={loading}
                            className="bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg transform hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                            {loading ? 'Generating Topics...' : 'Start New Session'}
                        </button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Prompt Cards */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-lg">Your Speaking Topics</h3>
                                <button onClick={startLesson} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> New Topics
                                </button>
                            </div>
                            
                            {lessonData.prompts.map((p, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                                            p.level === 'easy' ? 'bg-green-100 text-green-700' : 
                                            p.level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            Part {i + 1} ({p.level})
                                        </span>
                                        <button 
                                            onClick={() => handlePlayTTS(p.text, `prompt-${i}`)}
                                            className={`p-2 rounded-full transition-colors ${audioPlaying === `prompt-${i}` ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'}`}
                                        >
                                            {audioPlaying === `prompt-${i}` ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="font-serif text-lg text-slate-800 leading-relaxed">"{p.text}"</p>
                                </div>
                            ))}
                        </div>

                        {/* Model Answer (Shadowing) */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl h-fit sticky top-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-500 rounded-xl">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">Model Answer</h3>
                                    <p className="text-indigo-200 text-xs">Band 9.0 Demonstration</p>
                                </div>
                            </div>
                            
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6 backdrop-blur-sm relative">
                                <p className="leading-relaxed text-slate-300 italic">
                                    "{lessonData.modelAnswers.long}"
                                </p>
                            </div>

                            <button 
                                onClick={() => handlePlayTTS(lessonData.modelAnswers.long, 'model-answer')}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    audioPlaying === 'model-answer' 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-white text-slate-900 hover:bg-indigo-50'
                                }`}
                            >
                                {audioPlaying === 'model-answer' ? (
                                    <><StopCircle className="w-5 h-5" /> Stop Audio</>
                                ) : (
                                    <><Play className="w-5 h-5 fill-current" /> Listen & Shadow</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- EVALUATION MODE --- */}
        {activeTab === 'evaluate' && (
            <div className="grid xl:grid-cols-12 gap-8">
                
                {/* LEFT: Recorder Interface */}
                <div className="xl:col-span-5 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col h-[500px] relative">
                        {/* Visualizer Canvas Area */}
                        <div className="flex-1 bg-slate-50 relative flex flex-col items-center justify-center p-6">
                             {!audioUrl && !isRecording && (
                                 <div className="text-center">
                                     <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6">
                                         <Mic className="w-10 h-10 text-slate-300" />
                                     </div>
                                     <h3 className="text-xl font-bold text-slate-700 mb-2">Ready to Record</h3>
                                     <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                         Ensure you are in a quiet environment. Speak clearly for accurate AI analysis.
                                     </p>
                                 </div>
                             )}

                             {/* Visualizer Canvas (Hidden when not recording) */}
                             <canvas 
                                ref={canvasRef} 
                                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}
                                width={600}
                                height={400}
                             />

                             {/* Timer Overlay */}
                             {isRecording && (
                                 <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-mono font-bold animate-pulse shadow-lg">
                                     REC {formatDuration(recordingDuration)}
                                 </div>
                             )}

                             {/* Playback Preview */}
                             {audioUrl && !isRecording && (
                                 <div className="w-full max-w-sm bg-white p-4 rounded-2xl shadow-lg border border-slate-100 z-10">
                                     <div className="flex justify-between items-center mb-2">
                                         <span className="text-xs font-bold text-slate-400 uppercase">Preview</span>
                                         <button onClick={() => { setAudioUrl(null); setAudioBlob(null); setEvalData(null); }} className="text-xs text-red-500 font-bold hover:underline">Delete</button>
                                     </div>
                                     <audio src={audioUrl} controls className="w-full h-10" />
                                 </div>
                             )}
                        </div>

                        {/* Controls */}
                        <div className="p-8 bg-white border-t border-slate-100 z-10">
                            {!isRecording ? (
                                !audioUrl ? (
                                    <button 
                                        onClick={startRecording}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Mic className="w-5 h-5" /> Start Recording
                                    </button>
                                ) : (
                                    <button 
                                        onClick={analyzeAudio}
                                        disabled={loading}
                                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                                        {loading ? 'Analyzing Speech...' : 'Analyze Recording'}
                                    </button>
                                )
                            ) : (
                                <button 
                                    onClick={stopRecording}
                                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <StopCircle className="w-5 h-5" /> Stop Recording
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Analysis Dashboard */}
                <div className="xl:col-span-7">
                    {evalData ? (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* Score Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center">
                                <div className="flex-1 w-full h-64">
                                     <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 text-center">Skill Breakdown</h4>
                                     <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />
                                            <Radar name="My Score" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.2} />
                                            <Legend />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="md:w-48 text-center flex-none">
                                    <div className="inline-block p-4 rounded-full border-4 border-emerald-100 bg-emerald-50 mb-2">
                                        <span className="text-4xl font-extrabold text-emerald-600">
                                            {/* Average Score */}
                                            {((Object.values(evalData.scores) as number[]).reduce((a, b) => a + b, 0) / 5).toFixed(1)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600">Overall Band</p>
                                </div>
                            </div>

                            {/* Enhanced Mistake Analysis with Visual Feedback */}
                            {evalData.mistakes && evalData.mistakes.length > 0 && (
                                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
                                    <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" /> Pronunciation Analysis
                                    </h4>
                                    <p className="text-sm text-slate-500 mb-4">
                                        We detected potential errors in the following segments. 
                                    </p>
                                    
                                    {/* Visual Waveform Simulation */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4 flex items-center justify-center gap-1 overflow-hidden h-16">
                                        {/* Generate fake waveform bars */}
                                        {Array.from({ length: 40 }).map((_, i) => {
                                            const isError = i % 8 === 0 || i % 8 === 1; // Fake error spots
                                            const height = 20 + Math.random() * 40;
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`w-2 rounded-full ${isError ? 'bg-red-400' : 'bg-indigo-200'}`} 
                                                    style={{ height: `${height}%` }}
                                                ></div>
                                            )
                                        })}
                                    </div>

                                    <div className="space-y-3">
                                        {evalData.mistakes.map((m, i) => (
                                            <div key={i} className="flex items-start gap-4 p-3 bg-red-50 rounded-xl border border-red-100">
                                                <div className="flex-none p-2 bg-white rounded-full border border-red-100">
                                                    <AudioLines className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-bold text-slate-800 text-sm">"{m.word}"</p>
                                                        <ArrowRight className="w-3 h-3 text-red-300" />
                                                        <span className="bg-white px-2 py-0.5 rounded-lg border border-red-200 text-xs font-bold text-emerald-600">
                                                            {m.correction}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-red-600">{m.error}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Feedback Grid */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Pronunciation General */}
                                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <Volume2 className="w-5 h-5" /> General Feedback
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="bg-white/60 p-3 rounded-lg">
                                            <span className="text-xs font-bold text-purple-600 uppercase block mb-1">Strengths</span>
                                            <p className="text-sm text-slate-700">{evalData.pronunciationFeedback?.strengths[0]}</p>
                                        </div>
                                        <div className="bg-white/60 p-3 rounded-lg">
                                            <span className="text-xs font-bold text-red-500 uppercase block mb-1">Needs Work</span>
                                            <p className="text-sm text-slate-700">{evalData.pronunciationFeedback?.improvements[0]}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Improved Version */}
                                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                    <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                                        <Brain className="w-5 h-5" /> Native Refinement
                                    </h4>
                                    <div className="bg-white/60 p-4 rounded-xl border border-emerald-100/50 h-full">
                                        <p className="text-sm text-slate-700 leading-relaxed italic">
                                            "{evalData.correctedVersion}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Drills Section */}
                            {evalData.drills && evalData.drills.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-yellow-500" /> Recommended Drills
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {evalData.drills.slice(0,3).map((drill, i) => (
                                            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                                                    {drill.focus}
                                                </span>
                                                <p className="font-bold text-slate-800 text-sm mb-2">{drill.instruction}</p>
                                                <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">
                                                    "{drill.practice}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setShowChat(true)}
                                className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-5 h-5 text-indigo-600" />
                                Chat with AI Tutor about this result
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 opacity-70">
                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                                <Activity className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600">No Analysis Yet</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mt-2">
                                Record your speech on the left to receive a detailed breakdown of your IELTS performance.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Chat Tutor Overlay */}
        {showChat && evalData && (
            <ChatTutor 
                isOpen={showChat} 
                onClose={() => setShowChat(false)} 
                context={`User's Speech Evaluation: ${JSON.stringify(evalData)}`}
            />
        )}
    </div>
  );
};