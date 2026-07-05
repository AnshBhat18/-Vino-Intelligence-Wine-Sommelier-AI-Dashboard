import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { getModelInfo, retrainModel } from '../utils/api';
import { Sliders, Cpu, BarChart3, Image, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function RetrainPage() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Retrain parameters state
  const [params, setParams] = useState({
    n_estimators: 300,
    max_depth: 20,
    min_samples_split: 2,
    min_samples_leaf: 1,
    binary_classification: true,
    quality_threshold: 6,
    test_size: 0.2
  });

  const fetchModelDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModelInfo();
      setModelInfo(data);
      if (data.metadata?.best_params) {
        setParams(prev => ({
          ...prev,
          n_estimators: data.metadata.best_params.n_estimators || 300,
          max_depth: data.metadata.best_params.max_depth || 20,
          min_samples_split: data.metadata.best_params.min_samples_split || 2,
          min_samples_leaf: data.metadata.best_params.min_samples_leaf || 1,
          quality_threshold: data.quality_threshold || 6
        }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch model info from FastAPI backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelDetails();
  }, []);

  const handleRetrainSubmit = async (e) => {
    e.preventDefault();
    setRetraining(true);
    setSuccess(null);
    setError(null);
    try {
      const data = await retrainModel(params);
      setSuccess('Model successfully retrained! The server is now loading the updated classifier.');
      setModelInfo(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.detail || 'Retraining failed. Check backend console logs.');
    } finally {
      setRetraining(false);
    }
  };

  const handleParamChange = (name, value) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFeatureImportanceOption = () => {
    if (!modelInfo || !modelInfo.feature_importances) return {};
    
    // Sort and limit to top 15 features for clean view
    const sortedFi = [...modelInfo.feature_importances]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 15)
      .reverse(); // Reverse for horizontal layout

    const categories = sortedFi.map(f => f.feature);
    const importances = sortedFi.map(f => f.importance);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(22, 11, 14, 0.95)',
        borderColor: '#c9a96e',
        textStyle: { color: '#f5ede0' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(201, 169, 110, 0.08)' } },
        axisLabel: { color: '#8a7060', fontSize: 9 },
        axisLine: { lineStyle: { color: 'rgba(201, 169, 110, 0.2)' } }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#8a7060', fontSize: 9 },
        axisLine: { lineStyle: { color: 'rgba(201, 169, 110, 0.2)' } }
      },
      series: [
        {
          name: 'Importance Score',
          type: 'bar',
          data: importances,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: 'rgba(139, 26, 42, 0.3)' },
                { offset: 1, color: '#c9a96e' }
              ]
            },
            borderRadius: [0, 4, 4, 0]
          }
        }
      ]
    };
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      
      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs mb-6">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 text-xs mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Model Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Algorithm</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {modelInfo?.metadata?.model_name || 'Random Forest'}
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">Classifier</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Test Accuracy</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-gold-500">
              {modelInfo?.metadata?.test_accuracy ? `${(modelInfo.metadata.test_accuracy * 100).toFixed(2)}%` : '---'}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/20">Optimized</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Feature Size</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {modelInfo?.metadata?.feature_count || 40}
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">Engineered</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300">
          <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Retrain Jobs</div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Active
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">On-demand</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Tuning Hyperparameters Form (Left) */}
        <form onSubmit={handleRetrainSubmit} className="lg:col-span-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
              <div>
                <h2 className="font-serif text-base font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-gold-500" /> Hyperparameter Tuning
                </h2>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Customize the Random Forest estimator configuration.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Estimators (Number of Trees)</label>
                  <span className="font-mono text-xs font-bold text-gold-500">{params.n_estimators}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={params.n_estimators}
                  onChange={(e) => handleParamChange('n_estimators', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-merlot-800 dark:accent-gold-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Max Tree Depth</label>
                  <span className="font-mono text-xs font-bold text-gold-500">{params.max_depth}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={params.max_depth}
                  onChange={(e) => handleParamChange('max_depth', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-merlot-800 dark:accent-gold-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Min Samples Split</label>
                <select
                  value={params.min_samples_split}
                  onChange={(e) => handleParamChange('min_samples_split', parseInt(e.target.value))}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value={2}>2 (Default)</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Min Samples Leaf</label>
                <select
                  value={params.min_samples_leaf}
                  onChange={(e) => handleParamChange('min_samples_leaf', parseInt(e.target.value))}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value={1}>1 (Default)</option>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                </select>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Test Split Ratio</label>
                  <span className="font-mono text-xs font-bold text-gold-500">{params.test_size * 100}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={params.test_size}
                  onChange={(e) => handleParamChange('test_size', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-merlot-800 dark:accent-gold-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Quality Split Threshold</label>
                  <span className="font-mono text-xs font-bold text-gold-500">Quality &gt;= {params.quality_threshold}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="7"
                  step="1"
                  value={params.quality_threshold}
                  onChange={(e) => handleParamChange('quality_threshold', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-merlot-800 dark:accent-gold-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={retraining}
            className="w-full mt-8 bg-merlot-800 hover:bg-merlot-900 text-white font-semibold tracking-wider text-xs uppercase border border-gold-500/30 rounded-xl px-5 py-3.5 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {retraining ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Re-fitting Random Forest...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" /> Trigger Model Retrain
              </>
            )}
          </button>
        </form>

        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Feature Importances (Top Right) */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-[320px] transition-colors duration-300">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-gold-500" /> Relative Feature Importances
            </h2>
            
            {loading ? (
              <div className="h-[210px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-merlot-800 border-t-transparent"></div>
              </div>
            ) : modelInfo?.feature_importances?.length > 0 ? (
              <div className="h-[230px] w-full">
                <ReactECharts option={getFeatureImportanceOption()} style={{ height: '100%', width: '100%' }} />
              </div>
            ) : (
              <div className="h-[210px] flex items-center justify-center text-zinc-400">No feature importance metrics computed.</div>
            )}
          </div>

          {/* Confusion Matrix Image (Bottom Right) */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex-1 flex flex-col">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-gold-500" /> Active Model Evaluation
            </h2>
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-4">
              <div className="max-w-[280px] w-full border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-inner bg-zinc-950">
                <img 
                  src="http://localhost:8001/static/model/confusion_matrix.png" 
                  alt="Confusion Matrix" 
                  className="w-full h-auto object-contain select-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%231a1a1a"/><text x="100" y="75" fill="%23666" font-family="sans-serif" font-size="12" text-anchor="middle">Loading Matrix Plot...</text></svg>';
                  }}
                />
              </div>
              <div className="max-w-md space-y-3.5 text-xs text-zinc-500 dark:text-zinc-400">
                <h4 className="font-bold text-zinc-700 dark:text-zinc-300">Understanding the Confusion Matrix</h4>
                <p className="leading-relaxed">
                  The confusion matrix evaluates model accuracy on the held-out test split. True values represent actual sommelier ratings, and predicted values represent model ratings.
                </p>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg space-y-1 font-mono text-[10px]">
                  <div>• <span className="font-bold text-emerald-500">True Positives (TP):</span> Good wines classified correctly.</div>
                  <div>• <span className="font-bold text-rose-500">False Positives (FP):</span> Below standard wines classified as good.</div>
                  <div>• <span className="font-bold text-emerald-500">True Negatives (TN):</span> Below standard wines classified correctly.</div>
                  <div>• <span className="font-bold text-rose-500">False Negatives (FN):</span> Good wines classified as below standard.</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
