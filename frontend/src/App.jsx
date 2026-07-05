import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PredictPage from './pages/PredictPage';
import BatchPage from './pages/BatchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RetrainPage from './pages/RetrainPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('predict');
  const [dark, setDark] = useState(true);

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDark(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${dark ? 'wine-app-bg text-zinc-100' : 'light-app-bg text-zinc-900'}`}>
      
      {/* Navigation & Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        dark={dark} 
        setDark={setDark} 
      />

      {/* Main Content Area */}
      <main className="flex-grow transition-opacity duration-200">
        {activeTab === 'predict' && <PredictPage />}
        {activeTab === 'batch' && <BatchPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'retrain' && <RetrainPage />}
      </main>

      {/* Luxury Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/30 bg-white/20 dark:bg-[#060203]/20 py-6 mt-12 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">
            Vino Intelligence • Full-Stack Sommelier Assistant
          </p>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium">
            Random Forest Classifier • Stratified SMOTE Balancing • SQLite Logs & Feedback API
          </p>
        </div>
      </footer>

    </div>
  );
}
