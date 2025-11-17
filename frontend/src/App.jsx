import { useState, useEffect } from 'react';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Activity, History, LogOut, FileText, ArrowRight, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  // Views: 'upload', 'loading', 'dashboard', 'history'
  const [view, setView] = useState('upload'); 
  const [analysis, setAnalysis] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [error, setError] = useState('');

  // --- AUTH ---
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

  // --- API CALLS ---
  const API_URL = import.meta.env.VITE_API_URL;

  const handleAnalyze = async (file) => {
    if (!file) return;
    
    // 1. Immediately switch to loading view
    setView('loading');
    setError('');
    
    const formData = new FormData();
    formData.append('report', file);
    formData.append('userId', user?.uid);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok) {
        setAnalysis(data);
        setView('dashboard'); // 2. Switch to dashboard on success
      } else {
        throw new Error(data.message || "Analysis failed");
      }
    } catch (err) {
      setError(err.message);
      setView('upload'); // Go back to upload on error
    }
  };

  const loadHistory = async () => {
    setView('loading'); // Show loader while fetching
    try {
      const res = await fetch(`${API_URL}/history/${user?.uid}`);
      const data = await res.json();
      setHistoryList(data);
      setView('history');
    } catch (err) { 
      console.error(err); 
      setView('upload');
    }
  };

  // --- LOGIN SCREEN ---
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
          <Activity size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">FitScore<span className="text-blue-600">AI</span></h1>
        <p className="text-slate-500 mb-8 text-lg">Turn complex medical reports into clear, actionable health insights.</p>
        <button onClick={handleLogin} className="w-full bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" />
          <span>Sign in with Google</span>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </div>
  );

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('upload')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Activity size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">FitScore<span className="text-blue-600">AI</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={loadHistory} className={`text-sm font-medium transition-colors ${view === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
              History
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <img src={user.photoURL} className="h-9 w-9 rounded-full border-2 border-white shadow-sm" alt="User" />
              <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 py-10">
        <AnimatePresence mode="wait">
          
          {/* 1. VIEW: LOADING (Replaces Upload immediately) */}
          {view === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="min-h-[60vh] flex flex-col items-center justify-center text-center"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mt-8">Analyzing Document...</h2>
              <p className="text-slate-500 mt-2 animate-pulse">Gemini is extracting vitals & creating your plan.</p>
            </motion.div>
          )}

          {/* 2. VIEW: UPLOAD */}
          {view === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Understand your health <br/><span className="text-blue-600">in seconds.</span>
              </h1>
              <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto">
                Upload any blood test, checkup result, or medical PDF. We'll analyze the vitals and give you a personalized score.
              </p>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:border-blue-300 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <input 
                  type="file" 
                  onChange={(e) => handleAnalyze(e.target.files[0])} 
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
                  accept=".pdf,.jpg,.png,.jpeg"
                />
                <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl h-64 flex flex-col items-center justify-center group-hover:bg-blue-50/50 group-hover:border-blue-400 transition-all duration-300">
                  <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="text-blue-600" size={28} />
                  </div>
                  <p className="text-lg font-bold text-slate-700 group-hover:text-blue-700">Click to Upload Report</p>
                  <p className="text-sm text-slate-400 mt-2">PDF, PNG, JPG supported</p>
                </div>
              </div>
              {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2"><AlertCircle size={20}/> {error}</div>}
            </motion.div>
          )}

          {/* 3. VIEW: DASHBOARD */}
          {view === 'dashboard' && analysis && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Score Card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-green-400"></div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Wellness Score</h3>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={560} strokeDashoffset={560 - (560 * analysis.score / 100)} className={`text-blue-600 transition-all duration-1000 ease-out`} />
                    </svg>
                    <span className="absolute text-6xl font-black text-slate-900">{analysis.score}</span>
                  </div>
                  <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left">
                    <p className="text-sm text-slate-600 leading-relaxed">{analysis.summary}</p>
                  </div>
                  <button onClick={() => setView('upload')} className="mt-6 w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition">Upload New</button>
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-8 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="text-blue-500" size={24}/> Extracted Vitals
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {analysis.vitals && Object.entries(analysis.vitals).map(([key, value], idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        key={key} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 truncate" title={key}>{key}</p>
                        <p className="text-sm font-bold text-slate-800 break-words">{value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" size={24}/> AI Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RecCard title="Diet" items={analysis.recommendations?.diet} color="green" icon="🥗" />
                    <RecCard title="Exercise" items={analysis.recommendations?.exercise} color="orange" icon="💪" />
                    <RecCard title="Lifestyle" items={analysis.recommendations?.lifestyle} color="indigo" icon="💤" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. VIEW: HISTORY */}
          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Your History</h2>
                <button onClick={() => setView('upload')} className="text-blue-600 font-bold hover:underline">Back to Upload</button>
              </div>

              <div className="space-y-4">
                {historyList.length === 0 && (
                   <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <FileText size={32} />
                     </div>
                     <h3 className="text-lg font-bold text-slate-700">No reports yet</h3>
                     <p className="text-slate-500">Upload your first document to start tracking.</p>
                   </div>
                )}

                {historyList.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    onClick={() => { setAnalysis(item); setView('dashboard'); }}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-500 cursor-pointer transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${item.score >= 80 ? 'bg-green-100 text-green-700' : item.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {item.score}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.fileName}</h4>
                        <p className="text-xs text-slate-400 uppercase font-bold mt-1">{item.date}</p>
                      </div>
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

// Helper Component
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
        {items?.length ? items.map((i, idx) => (
          <li key={idx} className="text-sm opacity-80 flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
            <span className="leading-relaxed">{i}</span>
          </li>
        )) : <li className="text-sm opacity-50 italic">No specific notes</li>}
      </ul>
    </div>
  );
};

export default App;