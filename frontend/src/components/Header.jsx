import React, { useEffect, useState } from 'react';
import { Sun, Moon, Activity, Wine } from 'lucide-react';
import axios from 'axios';

export default function Header({ activeTab, setActiveTab, dark, setDark }) {
  const [backendStatus, setBackendStatus] = useState('connecting');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8000/');
        if (response.data && response.data.status === 'online') {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !dark;
    setDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const tabs = [
    { id: 'predict', label: 'Predict quality' },
    { id: 'batch', label: 'Batch Processing' },
    { id: 'analytics', label: 'History & Analytics' },
    { id: 'retrain', label: 'Model Retraining' },
  ];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-[#060203]/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Title / Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-merlot-800 p-2.5 rounded-xl border border-gold-500/30 text-gold-500 shadow-lg shadow-merlot-950/20">
            <Wine className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Vino <em className="text-gold-500 font-serif not-italic">Intelligence</em>
              </h1>
              {backendStatus === 'online' ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Activity className="w-2.5 h-2.5" /> API CONNECTED
                </span>
              ) : backendStatus === 'connecting' ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" /> PINGING API
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-500/20">
                  API OFFLINE
                </span>
              )}
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
              Sommelier Machine Learning System
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-zinc-100 dark:bg-[#120709] p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg tracking-wide transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-merlot-800 text-merlot-800 dark:text-white shadow-sm border border-zinc-200/50 dark:border-gold-500/10'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Theme Toggle / Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm"
            title="Toggle Theme"
          >
            {dark ? <Sun className="w-4 h-4 text-gold-500" /> : <Moon className="w-4 h-4 text-merlot-800" />}
          </button>
        </div>

      </div>
    </header>
  );
}
