import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { predictSingle } from '../utils/api';
import { CheckCircle, AlertTriangle, HelpCircle, Info, Sparkles, RefreshCw, Wine } from 'lucide-react';

export default function PredictPage() {
  const [formData, setFormData] = useState({
    fixed_acidity: 7.5,
    volatile_acidity: 0.5,
    citric_acid: 0.3,
    residual_sugar: 2.5,
    chlorides: 0.08,
    free_sulfur_dioxide: 15.0,
    total_sulfur_dioxide: 40.0,
    density: 0.996,
    ph: 3.3,
    sulphates: 0.65,
    alcohol: 10.5
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sliderDefinitions = [
    { name: 'fixed_acidity', label: 'Fixed Acidity (g/L)', min: 3.8, max: 15.0, step: 0.1, category: 'Acidity' },
    { name: 'volatile_acidity', label: 'Volatile Acidity (g/L)', min: 0.08, max: 1.6, step: 0.01, category: 'Acidity' },
    { name: 'citric_acid', label: 'Citric Acid (g/L)', min: 0.0, max: 1.0, step: 0.01, category: 'Acidity' },
    { name: 'ph', label: 'pH Balance', min: 2.7, max: 4.0, step: 0.01, category: 'Acidity' },
    
    { name: 'residual_sugar', label: 'Residual Sugar (g/L)', min: 0.6, max: 66.0, step: 0.1, category: 'Sugar & Minerals' },
    { name: 'chlorides', label: 'Chlorides (g/L)', min: 0.009, max: 0.35, step: 0.001, category: 'Sugar & Minerals' },
    { name: 'free_sulfur_dioxide', label: 'Free SO₂ (mg/L)', min: 1.0, max: 290.0, step: 1.0, category: 'Sugar & Minerals' },
    { name: 'total_sulfur_dioxide', label: 'Total SO₂ (mg/L)', min: 6.0, max: 440.0, step: 1.0, category: 'Sugar & Minerals' },
    
    { name: 'density', label: 'Density (g/cm³)', min: 0.987, max: 1.040, step: 0.0001, category: 'Finish & Body' },
    { name: 'sulphates', label: 'Sulphates (g/L)', min: 0.22, max: 2.0, step: 0.01, category: 'Finish & Body' },
    { name: 'alcohol', label: 'Alcohol (%ABV)', min: 8.0, max: 15.0, step: 0.1, category: 'Finish & Body' }
  ];

  const handleSliderChange = (name, val) => {
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(val)
    }));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await predictSingle(formData);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred during prediction.');
    } finally {
      setLoading(false);
    }
  };

  const getChemicalAdvice = () => {
    if (!result) return [];
    const advice = [];
    if (formData.volatile_acidity > 0.6) {
      advice.push({
        type: 'warning',
        text: 'High volatile acidity detected. This indicates excessive acetic acid build-up, which can lead to a sour, vinegary taste. Ensure cellar sanitation, minimal head-space, and monitor acetic acid bacteria.'
      });
    }
    if (formData.alcohol < 9.5) {
      advice.push({
        type: 'info',
        text: 'Low alcohol volume (%ABV) detected. This might reduce the body, weight, and finish length of the wine. Consider adjusting starting sugar concentration in future fermentations.'
      });
    }
    if (formData.sulphates < 0.45) {
      advice.push({
        type: 'warning',
        text: 'Low sulphate preservative levels. Sulphates act as antioxidants and antimicrobial agents; low levels risk rapid oxidation, browning, and bacterial spoilage in bottle.'
      });
    }
    if (formData.ph > 3.6) {
      advice.push({
        type: 'warning',
        text: 'High pH (low acidity) level. This reduces color stability and preservative efficiency, making the wine feel flat. Tartaric acid additions may be needed.'
      });
    }
    if (formData.ph < 3.0) {
      advice.push({
        type: 'info',
        text: 'Highly acidic pH detected. While crisp, the wine might feel overly sharp or tart. De-acidification options or malolactic fermentation could soften this.'
      });
    }
    if (formData.free_sulfur_dioxide / (formData.total_sulfur_dioxide + 1) < 0.20) {
      advice.push({
        type: 'info',
        text: 'Low ratio of Free to Total SO₂. Much of your sulfur is bound and inactive. Check for high oxygen uptake or yeast stress releasing binding compounds.'
      });
    }

    if (advice.length === 0) {
      advice.push({
        type: 'success',
        text: 'Chemical parameters are exceptionally well-balanced! All critical indicators align with high-quality standards. The SO₂ preservation ratio is optimal.'
      });
    }
    return advice;
  };

  // Pre-calculate slider values normalized for radar chart
  const radarIndicator = [
    { name: 'Alcohol', max: 1 },
    { name: 'Acidity', max: 1 },
    { name: 'Sugar Control', max: 1 },
    { name: 'Sulphates', max: 1 },
    { name: 'pH Balance', max: 1 },
    { name: 'SO₂ Control', max: 1 }
  ];

  const getRadarValues = () => {
    const alcohol_norm = (formData.alcohol - 8) / 7;
    const acidity_norm = 1 - (formData.volatile_acidity / 1.6);
    const sugar_norm = 1 - Math.min(formData.residual_sugar / 20, 1);
    const sulphates_norm = (formData.sulphates - 0.22) / 1.78;
    const ph_norm = 1 - Math.abs(formData.ph - 3.25) / 0.75;
    const so2_ratio = formData.free_sulfur_dioxide / (formData.total_sulfur_dioxide + 1);

    return [
      Math.max(0, Math.min(1, alcohol_norm)),
      Math.max(0, Math.min(1, acidity_norm)),
      Math.max(0, Math.min(1, sugar_norm)),
      Math.max(0, Math.min(1, sulphates_norm)),
      Math.max(0, Math.min(1, ph_norm)),
      Math.max(0, Math.min(1, so2_ratio))
    ];
  };

  const getRadarOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(22, 11, 14, 0.95)',
        borderColor: '#c9a96e',
        textStyle: { color: '#f5ede0', fontFamily: 'Montserrat' }
      },
      radar: {
        indicator: radarIndicator,
        radius: '68%',
        splitNumber: 4,
        axisName: {
          color: '#8a7060',
          fontFamily: 'Montserrat',
          fontSize: 10,
          fontWeight: 600
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(201, 169, 110, 0.12)'
          }
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(201, 169, 110, 0.01)', 'rgba(201, 169, 110, 0.03)']
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(201, 169, 110, 0.15)'
          }
        }
      },
      series: [
        {
          name: 'Chemical Profile',
          type: 'radar',
          data: [
            {
              value: getRadarValues(),
              name: 'Current Composition',
              symbol: 'circle',
              symbolSize: 4,
              itemStyle: {
                color: '#c9a96e'
              },
              lineStyle: {
                color: '#c9a96e',
                width: 2
              },
              areaStyle: {
                color: 'rgba(139, 26, 42, 0.25)'
              }
            }
          ]
        }
      ]
    };
  };

  const getDonutOption = () => {
    if (!result) return {};
    const pctGood = result.is_good ? result.confidence * 100 : (1 - result.confidence) * 100;
    const pctBad = 100 - pctGood;

    return {
      series: [
        {
          name: 'Sommelier Assessment',
          type: 'pie',
          radius: ['65%', '85%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: false
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { 
              value: pctGood, 
              name: 'Good Quality',
              itemStyle: { color: '#10b981' } 
            },
            { 
              value: pctBad, 
              name: 'Below Standard',
              itemStyle: { color: '#ef4444' } 
            }
          ]
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: `${(result.confidence * 100).toFixed(0)}%\nConfidence`,
            textAlign: 'center',
            fill: '#c9a96e',
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Montserrat'
          }
        }
      ]
    };
  };

  // Group sliders by category
  const categories = ['Acidity', 'Sugar & Minerals', 'Finish & Body'];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders Container (Left) */}
        <form onSubmit={handleAnalyze} className="lg:col-span-7 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
            <div>
              <h2 className="font-serif text-xl font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-500" /> Chemical Parameters
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Adjust sliders to simulate your wine composition and run inference.</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({
                fixed_acidity: 7.5,
                volatile_acidity: 0.5,
                citric_acid: 0.3,
                residual_sugar: 2.5,
                chlorides: 0.08,
                free_sulfur_dioxide: 15.0,
                total_sulfur_dioxide: 40.0,
                density: 0.996,
                ph: 3.3,
                sulphates: 0.65,
                alcohol: 10.5
              })}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="space-y-6">
            {categories.map(cat => (
              <div key={cat} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-merlot-800 dark:text-gold-500 border-b border-zinc-100 dark:border-zinc-800 pb-1">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {sliderDefinitions.filter(d => d.category === cat).map(slider => (
                    <div key={slider.name} className="flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{slider.label}</label>
                        <span className="font-mono text-xs font-bold text-merlot-800 dark:text-gold-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/40">
                          {formData[slider.name].toFixed(slider.step >= 0.01 ? (slider.step >= 0.1 ? 1 : 2) : 4)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={formData[slider.name]}
                        onChange={(e) => handleSliderChange(slider.name, e.target.value)}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-merlot-800 dark:accent-gold-500 focus:outline-none"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-400 dark:text-zinc-500 mt-1">
                        <span>Min: {slider.min}</span>
                        <span>Max: {slider.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-merlot-800 dark:bg-merlot-800 hover:bg-merlot-900 dark:hover:bg-merlot-900 text-white font-semibold tracking-wider text-xs uppercase border border-gold-500/30 rounded-xl px-6 py-4 shadow-lg hover:shadow-merlot-950/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing chemical chemistry...
              </>
            ) : '⚗ Analyse Wine Composition'}
          </button>
        </form>

        {/* Results Container (Right) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Output Card */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors duration-300 flex-1 flex flex-col justify-between">
            <h2 className="font-serif text-xl font-semibold text-zinc-950 dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">Sommelier Assessment</h2>
            
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 p-4 rounded-xl flex gap-3 text-xs mb-4">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Prediction Error:</span> {error}
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <HelpCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                <h3 className="font-serif text-lg font-semibold text-zinc-400 dark:text-zinc-600">Pending Chemical Analysis</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mt-1">Adjust sliders and click the Analyse button to evaluate chemical quality factors.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-merlot-800/10 border-t-merlot-800 animate-spin"></div>
                  <Wine className="w-7 h-7 text-merlot-800 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Sommelier AI at Work</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Evaluating multi-feature interactions...</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  
                  {/* Verdict badge */}
                  <div className={`p-6 rounded-2xl text-center border shadow-sm flex flex-col items-center justify-center ${
                    result.is_good 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400' 
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400'
                  }`}>
                    <span className="text-3xl mb-2">{result.is_good ? '🍾' : '🔬'}</span>
                    <div className="text-2xl font-serif font-bold tracking-tight mb-1">{result.quality_label}</div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {result.is_good ? 'Meets Standards' : 'Below Standard'}
                    </span>
                  </div>

                  {/* Confidence Chart */}
                  <div className="h-[140px] flex items-center justify-center">
                    <ReactECharts option={getDonutOption()} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>

                {/* Sommelier Advisor */}
                <div className="bg-zinc-50 dark:bg-[#120709] border border-zinc-100 dark:border-zinc-900 p-4 rounded-xl flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold-500" /> Sommelier AI Advisor
                  </h4>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {getChemicalAdvice().map((adv, idx) => (
                      <div key={idx} className="flex gap-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {adv.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                        {adv.type === 'info' && <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                        {adv.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                        <span>{adv.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Radar Plot Card */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors duration-300 h-[280px]">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">Chemical Profile Radar</h2>
            <div className="h-[210px] w-full">
              <ReactECharts option={getRadarOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
