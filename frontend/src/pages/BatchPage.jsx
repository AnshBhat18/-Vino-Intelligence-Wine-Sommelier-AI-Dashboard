import React, { useState, useRef } from 'react';
import { predictBatch } from '../utils/api';
import { Upload, Download, FileText, CheckCircle2, AlertCircle, FileDown, Search } from 'lucide-react';

export default function BatchPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, good, bad
  const fileInputRef = useRef(null);

  // Template data generator
  const downloadTemplate = () => {
    const csvContent = 
      "fixed_acidity,volatile_acidity,citric_acid,residual_sugar,chlorides,free_sulfur_dioxide,total_sulfur_dioxide,density,ph,sulphates,alcohol\n" +
      "7.4,0.7,0.0,1.9,0.076,11.0,34.0,0.9978,3.51,0.56,9.4\n" +
      "7.8,0.88,0.0,2.6,0.098,25.0,67.0,0.9968,3.2,0.68,9.8\n" +
      "11.2,0.28,0.56,1.9,0.075,17.0,60.0,0.998,3.16,0.58,9.8\n" +
      "7.4,0.59,0.08,4.4,0.086,6.0,29.0,0.9974,3.38,0.5,9.0\n" +
      "7.9,0.32,0.51,1.8,0.341,17.0,56.0,0.9969,3.04,1.08,9.2\n" +
      "7.3,0.65,0.0,1.2,0.065,15.0,21.0,0.9946,3.39,0.47,10.0\n" +
      "6.7,0.58,0.08,1.8,0.097,15.0,65.0,0.9959,3.28,0.54,9.2\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "wine_chemistry_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const data = await predictBatch(file);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to analyze the batch CSV file. Ensure all columns match the template.');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!results || !results.predictions) return;
    
    // Construct output CSV header and contents
    const headers = [
      "row_index", "fixed_acidity", "volatile_acidity", "citric_acid", "residual_sugar", 
      "chlorides", "free_sulfur_dioxide", "total_sulfur_dioxide", "density", 
      "ph", "sulphates", "alcohol", "prediction", "confidence", "verdict"
    ].join(",");

    const rows = results.predictions.map(p => [
      p.row_index, p.fixed_acidity, p.volatile_acidity, p.citric_acid, p.residual_sugar,
      p.chlorides, p.free_sulfur_dioxide, p.total_sulfur_dioxide, p.density,
      p.ph, p.sulphates, p.alcohol, p.prediction, p.confidence.toFixed(4), p.quality_label
    ].join(","));

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wine_batch_predictions_${results.batch_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPredictions = results?.predictions?.filter(p => {
    // Text search filter
    const matchesSearch = 
      p.alcohol.toString().includes(searchTerm) || 
      p.ph.toString().includes(searchTerm) ||
      p.quality_label.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    if (filterType === 'good') return matchesSearch && p.is_good;
    if (filterType === 'bad') return matchesSearch && !p.is_good;
    return matchesSearch;
  }) || [];

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      
      {/* Overview Intro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        <div className="lg:col-span-8 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-500" /> Batch Processing Pipeline
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
              Process thousands of wine chemistry records in a single click. Upload a CSV file matching our format and download prediction verdicts appended with ML confidence ratings.
            </p>
          </div>
          
          <button
            onClick={downloadTemplate}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            <Download className="w-4 h-4 text-gold-500" /> Get CSV Template
          </button>
        </div>

        {/* Upload Action */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">Model Mode</h3>
          <div className="bg-zinc-50 dark:bg-[#120709] border border-zinc-100 dark:border-zinc-900 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Binary Sommelier Mode:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Quality Class (≥6)</span>
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div className="grid grid-cols-1 gap-8">
        
        {!results && (
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <form 
              onSubmit={handleUploadSubmit}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center transition-all ${
                dragActive 
                  ? 'border-merlot-800 bg-merlot-950/10' 
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
              />
              
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-400 dark:text-zinc-500 mb-4">
                <Upload className="w-8 h-8" />
              </div>

              {file ? (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{file.name}</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Drag and drop your chemical CSV file here</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">or click to browse local files (CSV only)</p>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-400 p-3 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {file ? (
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-merlot-800 hover:bg-merlot-900 text-white font-semibold tracking-wider text-xs uppercase px-6 py-3 rounded-lg transition-colors shadow disabled:opacity-50"
                  >
                    {loading ? 'Analyzing batch...' : 'Process Batch Prediction'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-semibold text-xs tracking-wider uppercase px-6 py-3 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold tracking-wider text-xs uppercase px-6 py-3 rounded-lg transition-colors shadow-sm"
                >
                  Browse Files
                </button>
              )}
            </form>
          </div>
        )}

        {/* Results View */}
        {results && (
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
            
            {/* Header controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Analysis Complete
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Processed {results.total_records} records. Batch ID: <span className="font-mono text-zinc-800 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded">{results.batch_id}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                
                {/* Search bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search results..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-merlot-800 w-[180px]"
                  />
                </div>

                {/* Filter segments */}
                <div className="bg-zinc-100 dark:bg-[#120709] p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/30 flex text-xs">
                  <button 
                    onClick={() => setFilterType('all')} 
                    className={`px-3 py-1.5 rounded-lg ${filterType === 'all' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilterType('good')} 
                    className={`px-3 py-1.5 rounded-lg ${filterType === 'good' ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm' : 'text-zinc-400'}`}
                  >
                    Good Quality
                  </button>
                  <button 
                    onClick={() => setFilterType('bad')} 
                    className={`px-3 py-1.5 rounded-lg ${filterType === 'bad' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-zinc-400'}`}
                  >
                    Below Standard
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={exportResults}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow"
                >
                  <FileDown className="w-4 h-4" /> Export CSV
                </button>

                <button
                  onClick={() => {
                    setResults(null);
                    setFile(null);
                  }}
                  className="border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-semibold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition-colors"
                >
                  Upload New
                </button>

              </div>
            </div>

            {/* Results Grid Table */}
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-[460px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
                  <tr className="text-zinc-500 dark:text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="p-3 pl-4">Row</th>
                    <th className="p-3">Alcohol (%)</th>
                    <th className="p-3">Acidity (Vol/Fix)</th>
                    <th className="p-3">Sugar (g/L)</th>
                    <th className="p-3">pH</th>
                    <th className="p-3">Sulphates</th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3 pr-4 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                  {filteredPredictions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-zinc-400 dark:text-zinc-600">No predictions matching your criteria.</td>
                    </tr>
                  ) : (
                    filteredPredictions.map((row) => (
                      <tr key={row.row_index} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="p-3 pl-4 font-mono font-medium text-zinc-400">{row.row_index}</td>
                        <td className="p-3 font-semibold">{row.alcohol}%</td>
                        <td className="p-3">{row.volatile_acidity} / {row.fixed_acidity}</td>
                        <td className="p-3">{row.residual_sugar} g/L</td>
                        <td className="p-3 font-mono">{row.ph}</td>
                        <td className="p-3">{row.sulphates}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            row.is_good 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {row.quality_label}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-right font-mono font-semibold text-gold-500">{(row.confidence * 100).toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
