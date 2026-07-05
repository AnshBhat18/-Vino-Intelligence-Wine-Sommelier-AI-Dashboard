import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { getPredictionHistory, submitFeedback, clearPredictionHistory } from '../utils/api';
import { BarChart, History, Check, X, Database, Trash2, Sliders, AlertCircle, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function AnalyticsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({ total: 0, goodRatio: 0, avgAlcohol: 0, feedbackRate: 0 });
  const [feedbackRecordId, setFeedbackRecordId] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ actual_quality: 6, feedback_correct: true, feedback_comments: '' });

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPredictionHistory();
      setHistory(data);
      calculateKpis(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch prediction history logs from SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const calculateKpis = (records) => {
    if (!records || records.length === 0) {
      setKpis({ total: 0, goodRatio: 0, avgAlcohol: 0, feedbackRate: 0 });
      return;
    }
    const total = records.length;
    const goodCount = records.filter(r => r.predicted_quality === 1).length;
    const avgAlc = records.reduce((acc, r) => acc + r.alcohol, 0) / total;
    const fedCount = records.filter(r => r.feedback_correct !== null).length;

    setKpis({
      total,
      goodRatio: (goodCount / total) * 100,
      avgAlcohol: avgAlc,
      feedbackRate: (fedCount / total) * 100
    });
  };

  const handleFeedbackSubmit = async (recordId) => {
    try {
      await submitFeedback(recordId, {
        actual_quality: parseInt(feedbackForm.actual_quality),
        feedback_correct: feedbackForm.feedback_correct,
        feedback_comments: feedbackForm.feedback_comments
      });
      setFeedbackRecordId(null);
      // Reset form
      setFeedbackForm({ actual_quality: 6, feedback_correct: true, feedback_comments: '' });
      fetchHistory();
    } catch (err) {
      alert('Failed to log feedback: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to permanently clear the prediction logs? This resets the history database.')) return;
    try {
      await clearPredictionHistory();
      fetchHistory();
    } catch (err) {
      alert('Failed to clear logs.');
    }
  };

  const getScatterChartOption = () => {
    // Format: [alcohol, volatile acidity, predicted_quality]
    const data = history.map(r => [
      r.alcohol,
      r.volatile_acidity,
      r.predicted_quality === 1 ? 'Good' : 'Below Standard'
    ]);

    return {
      title: {
        text: 'Alcohol vs Volatile Acidity Distribution',
        left: 'center',
        textStyle: { color: '#8a7060', fontSize: 12, fontFamily: 'Montserrat' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `<b>Alcohol:</b> ${params.value[0]}%<br/><b>Volatile Acidity:</b> ${params.value[1]} g/L<br/><b>Verdict:</b> ${params.value[2]}`;
        },
        backgroundColor: 'rgba(22, 11, 14, 0.95)',
        borderColor: '#c9a96e',
        textStyle: { color: '#f5ede0' }
      },
      legend: {
        bottom: 5,
        data: ['Good', 'Below Standard'],
        textStyle: { color: '#8a7060' }
      },
      grid: {
        top: 40,
        bottom: 60,
        left: 50,
        right: 20
      },
      xAxis: {
        name: 'Alcohol (%ABV)',
        nameLocation: 'middle',
        nameGap: 25,
        splitLine: { lineStyle: { color: 'rgba(201, 169, 110, 0.08)' } },
        axisLabel: { color: '#8a7060' },
        axisLine: { lineStyle: { color: 'rgba(201, 169, 110, 0.2)' } },
        min: 8,
        max: 15
      },
      yAxis: {
        name: 'Volatile Acidity (g/L)',
        nameLocation: 'middle',
        nameGap: 35,
        splitLine: { lineStyle: { color: 'rgba(201, 169, 110, 0.08)' } },
        axisLabel: { color: '#8a7060' },
        axisLine: { lineStyle: { color: 'rgba(201, 169, 110, 0.2)' } },
        min: 0,
        max: 1.6
      },
      series: [
        {
          name: 'Good',
          type: 'scatter',
          data: data.filter(d => d[2] === 'Good'),
          itemStyle: { color: '#10b981', opacity: 0.8 },
          symbolSize: 8
        },
        {
          name: 'Below Standard',
          type: 'scatter',
          data: data.filter(d => d[2] === 'Below Standard'),
          itemStyle: { color: '#ef4444', opacity: 0.8 },
          symbolSize: 8
        }
      ]
    };
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Total Predictions</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50">{kpis.total}</span>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">Logged in DB</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Good Wine Ratio</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.goodRatio.toFixed(1)}%</span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">Class Quality</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Average Alcohol</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50">{kpis.avgAlcohol.toFixed(2)}%</span>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">Volume ABV</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Sommelier Feedback Rate</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-gold-500">{kpis.feedbackRate.toFixed(1)}%</span>
            <span className="text-[10px] font-semibold text-gold-500 bg-gold-500/5 dark:bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">Reviewed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Logs Table (Left) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
            <div>
              <h2 className="font-serif text-xl font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <History className="w-5 h-5 text-gold-500" /> Database Logs & Feedback
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Audit recent predictions and log professional sommelier taste tests to adjust model accuracy.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchHistory}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {history.length > 0 && (
                <button
                  onClick={handleClear}
                  className="bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-xl border border-rose-500/20 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Logs
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 text-xs mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-merlot-800 border-t-transparent"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <Database className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="font-serif text-lg font-semibold text-zinc-400 dark:text-zinc-600">Database is empty</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mt-1">Predictions will be recorded here automatically when single or batch analyses are performed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-[380px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
                  <tr className="text-zinc-500 dark:text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="p-3 pl-4">Timestamp</th>
                    <th className="p-3">Alcohol</th>
                    <th className="p-3">pH</th>
                    <th className="p-3">Pred</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-center">Sommelier Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="p-3 pl-4 font-mono font-medium text-zinc-400">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-3">{record.alcohol}%</td>
                      <td className="p-3 font-mono">{record.ph}</td>
                      <td className="p-3 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          record.predicted_quality === 1 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-500/10' 
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-500/10'
                        }`}>
                          {record.predicted_quality === 1 ? 'Good' : 'Poor'}
                        </span>
                      </td>
                      <td className="p-3">
                        {record.batch_id ? (
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-600 px-2 py-0.5 rounded border border-blue-500/10">Batch: {record.batch_id}</span>
                        ) : (
                          <span className="text-[10px] bg-zinc-50 dark:bg-zinc-900 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/40">Single</span>
                        )}
                      </td>
                      <td className="p-3 pr-4 text-center">
                        {record.feedback_correct !== null ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${record.feedback_correct ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {record.feedback_correct ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />} 
                            {record.feedback_correct ? 'Verified' : `Mistake (Actual: ${record.actual_quality})`}
                          </span>
                        ) : feedbackRecordId === record.id ? (
                          <div className="flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 max-w-[280px] mx-auto text-xs">
                            <div className="flex flex-col gap-1 items-start w-full">
                              <span className="text-[9px] font-bold text-zinc-500">Correct verdict?</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setFeedbackForm(prev => ({ ...prev, feedback_correct: true }))}
                                  className={`px-2 py-1 rounded ${feedbackForm.feedback_correct ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600'}`}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setFeedbackForm(prev => ({ ...prev, feedback_correct: false }))}
                                  className={`px-2 py-1 rounded ${!feedbackForm.feedback_correct ? 'bg-rose-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600'}`}
                                >
                                  No
                                </button>
                              </div>
                              {!feedbackForm.feedback_correct && (
                                <div className="flex flex-col gap-1 mt-1.5 w-full">
                                  <label className="text-[8px] font-bold text-zinc-400">Actual Quality Score (3-9):</label>
                                  <input
                                    type="number"
                                    min="3"
                                    max="9"
                                    value={feedbackForm.actual_quality}
                                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, actual_quality: e.target.value }))}
                                    className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 text-xs rounded w-[60px]"
                                  />
                                </div>
                              )}
                              <button
                                onClick={() => handleFeedbackSubmit(record.id)}
                                className="w-full mt-2 bg-merlot-800 text-white text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded"
                              >
                                Submit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setFeedbackRecordId(record.id);
                              setFeedbackForm({ actual_quality: record.predicted_quality === 1 ? 5 : 7, feedback_correct: true, feedback_comments: '' });
                            }}
                            className="text-[10px] font-semibold text-gold-500 hover:underline inline-flex items-center gap-1"
                          >
                            Review prediction
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Analytics Plot (Right) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-[480px] transition-colors duration-300">
          <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4">Chemical Distributions</h2>
          
          {history.length < 3 ? (
            <div className="h-[360px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <BarChart className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="font-serif text-base font-semibold text-zinc-400 dark:text-zinc-600">Waiting for Data</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mt-1">Make at least 3 predictions to plot interactive distribution charts.</p>
            </div>
          ) : (
            <div className="h-[360px] w-full">
              <ReactECharts option={getScatterChartOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
