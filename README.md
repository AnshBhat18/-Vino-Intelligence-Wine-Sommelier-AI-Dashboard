# 🍷 Vino Intelligence — Premium Wine Sommelier AI Dashboard

Vino Intelligence is a professional, full-stack machine learning application designed to assess, predict, and analyze wine quality based on 11 fundamental chemical composition properties.

This repository refactors a single-file Streamlit demo into a production-ready, modular architecture:

- **Backend:** A FastAPI python web service providing request validation, SQLite persistence, and endpoints for predictions, batch processing, and retraining.
- **Frontend:** A React + Vite SPA using Tailwind CSS for dark/light styling, and ECharts for interactive visualizations (feature importances, chemistry radar plots, confidence donut charts).

---

## 🌟 Key Features

1. **Chemical Sommelier Predictor:**
   - Real-time simulation of wine chemistry using interactive sliders.
   - Outputs a prediction verdict (Good Quality vs Below Standard) and model confidence levels.
   - **Sommelier AI Advisor:** A rule-based chemical engine that highlights out-of-range parameters (like high volatile acidity, low sulphates, or incorrect pH levels) and suggests winery adjustment actions.

2. **Batch Processing Pipeline:**
   - Drop-zone for CSV batch uploads.
   - Pre-validates file formatting and column mappings.
   - Process multiple wine samples in bulk, render them in an interactive, searchable data table, and export results back as an updated CSV.

3. **Inference logs & Feedback Loop:**
   - Automatically logs all predictions in a local SQLite database.
   - Allows winemakers to submit actual test outcomes (👍 Correct / 👎 Incorrect) to log corrections and collect ground-truth feedback.
   - Displays real-time KPIs and interactive scatter plots mapping Alcohol vs Volatile Acidity distributions.

4. **Model Retraining & Dashboard:**
   - Form to tweak Random Forest hyperparameters (`n_estimators`, `max_depth`, `test_split`, `quality_threshold`) and execute retraining on the backend.
   - Renders live feature importance bar charts using ECharts.
   - Exposes updated model metrics and confusion matrix evaluations dynamically.

---

## 📂 Project Structure

```text
/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Settings, structured logging, custom error handlers
│   │   ├── db/               # SQLite database setup and SQLAlchemy schema
│   │   ├── ml/               # Inference engine, SMOTE resampling, and training pipeline
│   │   ├── routes/           # Router endpoints: predict, model, history
│   │   ├── schemas/          # Input/output validation models (Pydantic)
│   │   └── main.py           # Application bootstrapper
│   ├── tests/                # Automated pytest suite
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container config for FastAPI
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Header, navigation, dynamic elements
│   │   ├── pages/            # View tabs (Predict, Batch, Analytics, Retrain)
│   │   ├── utils/            # Axios API wrappers
│   │   ├── App.jsx           
│   │   └── main.jsx
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Custom Tailwind styling & wine color theme
│   ├── postcss.config.js     # PostCSS configuration
│   ├── nginx.conf            # Nginx static server routing fallback config
│   └── Dockerfile            # Multi-stage production container configuration
├── docker-compose.yml        # Multi-container orchestration config
├── WineQT.csv                # Core dataset
└── README.md                 # Project documentation
```

---

## 🚀 Running the Project

### Method 1: Using Docker Compose (Recommended)

This is the easiest way to launch both the frontend and backend services in isolated containers.

1. Ensure you have Docker and Docker Compose installed.
2. From the root directory, run:

   ```bash
   docker-compose up --build
   ```

3. Once completed:
   - Access the **React UI** at: `http://localhost:8080`
   - Access the **FastAPI Swagger API Docs** at: `http://localhost:8000/docs`

---

### Method 2: Local Development Setup

#### 1. Running the Backend

1. Navigate to the backend folder:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   ```

   - Windows:

     ```bash
     .venv\Scripts\activate
     ```

   - macOS/Linux:

     ```bash
     source .venv/bin/activate
     ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

#### 2. Running the Frontend

1. Navigate to the frontend folder:

   ```bash
   cd ../frontend
   ```

2. Install node dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the Vite React development server:

   ```bash
   npm run dev
   ```

4. Access the React app at the shown address (typically `http://localhost:5173`).

---

## 🧪 Testing

We use `pytest` for backend API testing. To run the test suite:

1. Ensure the backend virtual environment is active.
2. Run the following command from the root directory:

   ```bash
   python -m pytest backend/tests/
   ```

---

## 🛠️ Tech Stack

- **Backend:** FastAPI, Pydantic, SQLAlchemy, Scikit-Learn, Imbalanced-Learn (SMOTE), Joblib, SQLite.
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Axios, Apache ECharts.
- **DevOps:** Docker, Docker Compose, Nginx.
