import { useState, useEffect } from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Activity, History, LogOut, FileText, ArrowRight, ChevronRight, CheckCircle2, AlertCircle, Brain, Zap, ShieldCheck } from 'lucide-react';
import dashboardPreview from './assets/preview.png';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('upload'); 
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setView('upload');
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (err) { console.error(err); alert("Login failed"); }
  };

  // --- API & LOGIC ---
  const API_URL = import.meta.env.VITE_API_URL;

  // Color Logic for Score
  const getScoreColor = (score) => {
    if (score <= 30) return 'text-red-500 stroke-red-500';
    if (score <= 60) return 'text-orange-500 stroke-orange-500';
    if (score <= 80) return 'text-lime-500 stroke-lime-500'; // Light Green
    return 'text-green-600 stroke-green-600'; // Deep Green
  };

  const getScoreBg = (score) => {
    if (score <= 30) return 'bg-red-50 border-red-100';
    if (score <= 60) return 'bg-orange-50 border-orange-100';
    if (score <= 80) return 'bg-lime-50 border-lime-100';
    return 'bg-green-50 border-green-100';
  };

  const handleAnalyze = async (file) => {
    if (!file) return;
    setLoading(true); 
    setView('loading'); // Force switch to loading view
    setError('');
    
    const formData = new FormData();
    formData.append('report', file);
    formData.append('userId', user?.uid);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data);
        setView('dashboard');
      } else {
        throw new Error(data.message || "Analysis failed");
      }
    } catch (err) {
      setError(err.message);
      setView('upload');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setView('history');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/history/${user?.uid}`);
      const data = await res.json();
      setHistoryList(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // --- VIEW: LANDING / LOGIN ---
  // --- VIEW: LANDING / LOGIN ---
  if (!user) return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100">
      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
         <div className="flex items-center gap-2 font-extrabold text-2xl tracking-tight text-slate-900">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Activity size={20}/></div>
            FitScore<span className="text-blue-600">AI</span>
         </div>
         <button onClick={handleLogin} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition">Login</button>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-left z-10">
            <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-full mb-6 uppercase tracking-wider">
              New: Multi-page PDF Support
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Your Health, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Decoded.</span>
            </h1>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg">
              Stop guessing what your blood test results mean. Upload your report and get an instant, AI-powered breakdown of your vitals, diet, and lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleLogin} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
                Get Started Free
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} 
                className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 transition flex items-center justify-center"
              >
                How it Works
              </button>
            </div>
            <div className="mt-10 flex items-center gap-4 text-sm text-slate-400 font-medium">
               <div className="flex -space-x-2">
                 <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                 <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>
                 <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white"></div>
               </div>
               <p>Trusted by 100+ users this week</p>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            <img 
              src={dashboardPreview} 
              alt="FitScore AI Dashboard Preview" 
              className="relative rounded-3xl shadow-2xl border border-slate-100 hover:scale-[1.02] transition-all duration-500" 
            />
            
            {/* Floating Cards Animation */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
               <div className="bg-green-100 p-2 rounded-lg text-green-600"><Activity size={20}/></div>
               <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">Heart Rate</p>
                 <p className="text-lg font-bold text-slate-800">72 bpm</p>
               </div>
            </motion.div>

             <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 5, delay: 1 }}
              className="absolute top-10 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
            >
               <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><ShieldCheck size={20}/></div>
               <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">FitScore</p>
                 <p className="text-lg font-bold text-slate-800">92/100</p>
               </div>
            </motion.div>
          </motion.div>
        </div>

        {/* SECTION: HOW IT WORKS */}
        <div id="how-it-works" className="py-32 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">The Process</h2>
            <h3 className="text-4xl font-black text-slate-900 mb-4">Three Steps to a Healthier You</h3>
            <p className="text-slate-500 text-lg">We've simplified health analysis. No more confusing medical jargon or waiting for doctor appointments just to understand your baseline.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: <Upload size={32}/>, title: "1. Upload Report", desc: "Take a photo or upload a PDF of your latest blood test, lipid profile, or general checkup." },
              { icon: <Brain size={32}/>, title: "2. AI Analysis", desc: "Our advanced Gemini AI scans the document, extracting key vitals like Cholesterol, Sugar, and BP." },
              { icon: <Zap size={32}/>, title: "3. Get FitScore", desc: "Receive a personalized wellness score (0-100) along with a diet and exercise plan tailored to you." }
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                  {f.icon}
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-900">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: WHY FITSCORE */}
        <div className="py-20">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl md:text-5xl font-black mb-8 relative z-10">Ready to understand your body?</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 relative z-10">
              Join hundreds of users who are taking control of their health data today. Fast, secure, and powered by Google's latest AI.
            </p>
            <button onClick={handleLogin} className="relative z-10 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition shadow-2xl shadow-blue-900/50 text-lg">
              Analyze My Report Now
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-10 text-center">
        <p className="text-slate-400 font-medium text-sm">© 2025 FitScore AI. Built for the Google Cloud Hackathon.</p>
      </footer>
    </div>
  );

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('upload')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Activity size={20} /></div>
            <span className="text-xl font-bold tracking-tight">FitScore<span className="text-blue-600">AI</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={loadHistory} className={`text-sm font-medium transition-colors ${view === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>History</button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <img src={user.photoURL} className="h-9 w-9 rounded-full border-2 border-white shadow-sm" alt="User" />
              <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-500"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 py-10">
        <AnimatePresence mode="wait">
          
          {view === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[60vh] flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mt-8">Analyzing Document...</h2>
              <p className="text-slate-500 mt-2 animate-pulse">Extracting vitals & generating health insights.</p>
            </motion.div>
          )}

          {view === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Check your <span className="text-blue-600">FitScore.</span>
              </h1>
              <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto">Upload your medical report to get started.</p>
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:border-blue-300 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <input type="file" onChange={(e) => handleAnalyze(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" accept=".pdf,.jpg,.png,.jpeg" />
                <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl h-64 flex flex-col items-center justify-center group-hover:bg-blue-50/50 group-hover:border-blue-400 transition-all">
                  <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Upload className="text-blue-600" size={28} /></div>
                  <p className="text-lg font-bold text-slate-700 group-hover:text-blue-700">Click to Upload Report</p>
                  <p className="text-sm text-slate-400 mt-2">PDF, PNG, JPG supported</p>
                </div>
              </div>
              {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2"><AlertCircle size={20}/> {error}</div>}
            </motion.div>
          )}

          {view === 'dashboard' && analysis && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center relative overflow-hidden">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Wellness Score</h3>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={560} strokeDashoffset={560 - (560 * analysis.score / 100)} className={`${getScoreColor(analysis.score)} transition-all duration-1000 ease-out`} />
                    </svg>
                    <span className={`absolute text-6xl font-black ${getScoreColor(analysis.score).split(' ')[0]}`}>{analysis.score}</span>
                  </div>
                  <div className={`mt-8 p-4 rounded-xl text-left ${getScoreBg(analysis.score)}`}>
                    <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
                  </div>
                  <button onClick={() => setView('upload')} className="mt-6 w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition">Upload New</button>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity className="text-blue-500" size={24}/> Extracted Vitals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {analysis.vitals && Object.entries(analysis.vitals).map(([key, value], idx) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 truncate" title={key}>{key}</p>
                        <p className="text-sm font-bold text-slate-800 break-words">{value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Brain className="text-purple-500" size={24}/> AI Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RecCard title="Diet" items={analysis.recommendations?.diet} color="green" icon="🥗" />
                    <RecCard title="Exercise" items={analysis.recommendations?.exercise} color="orange" icon="💪" />
                    <RecCard title="Lifestyle" items={analysis.recommendations?.lifestyle} color="indigo" icon="💤" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Your History</h2>
                <button onClick={() => setView('upload')} className="text-blue-600 font-bold hover:underline">Back to Upload</button>
              </div>
              <div className="space-y-4">
                {!loading && historyList.length === 0 && <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500">No reports yet.</div>}
                {historyList.map((item, idx) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={idx} onClick={() => { setAnalysis(item); setView('dashboard'); }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-500 cursor-pointer transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getScoreBg(item.score)} text-slate-700`}>{item.score}</div>
                      <div><h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.fileName}</h4><p className="text-xs text-slate-400 uppercase font-bold mt-1">{item.date}</p></div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const RecCard = ({ title, items, color, icon }) => {
  const colors = {
    green: 'bg-green-50/50 border-green-100 text-green-900',
    orange: 'bg-orange-50/50 border-orange-100 text-orange-900',
    indigo: 'bg-indigo-50/50 border-indigo-100 text-indigo-900',
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color]}`}>
      <h4 className="font-bold mb-3 flex items-center gap-2">{icon} {title}</h4>
      <ul className="space-y-2">
        {items?.length ? items.map((i, idx) => <li key={idx} className="text-sm opacity-80 flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" /><span className="leading-relaxed">{i}</span></li>) : <li className="text-sm opacity-50 italic">No specific notes</li>}
      </ul>
    </div>
  );
};

export default App;