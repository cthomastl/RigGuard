"""
RigGuard Prediction Service
Provides anomaly detection and predictive maintenance scoring for oil & gas equipment.
"""
import os
import json
from datetime import datetime, timedelta
from typing import List, Optional
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="RigGuard Prediction Service", version="1.0.0")

# DB connection (read-only for analytics)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "rigguard")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD", "changeme")

db_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = None

def get_engine():
    global engine
    if engine is None:
        try:
            engine = create_engine(db_url, pool_pre_ping=True, connect_args={"ssl": {"verify_cert": False}} if os.getenv("DB_SSL") == "true" else {})
        except Exception as e:
            print(f"DB connection failed: {e}")
    return engine


# ─── Pydantic Models ──────────────────────────────────────────────────────────
class SensorDataPoint(BaseModel):
    value: float
    timestamp: Optional[str] = None

class AnomalyRequest(BaseModel):
    sensor_id: int
    readings: List[SensorDataPoint]
    contamination: float = 0.05

class HealthScoreRequest(BaseModel):
    equipment_id: int
    sensor_readings: dict  # {sensor_name: [values]}

class FailurePredictionRequest(BaseModel):
    equipment_id: int
    days_ahead: int = 30

class RULRequest(BaseModel):
    sensor_id: int
    current_value: float
    max_threshold: float
    degradation_rate: Optional[float] = None  # units/day


# ─── Anomaly Detection ────────────────────────────────────────────────────────
@app.post("/predict/anomaly")
async def detect_anomaly(req: AnomalyRequest):
    """Detect anomalies in sensor readings using Isolation Forest."""
    if len(req.readings) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 readings for anomaly detection")

    values = np.array([r.value for r in req.readings]).reshape(-1, 1)
    scaler = StandardScaler()
    values_scaled = scaler.fit_transform(values)

    model = IsolationForest(
        contamination=req.contamination,
        random_state=42,
        n_estimators=100,
    )
    predictions = model.fit_predict(values_scaled)
    scores = model.score_samples(values_scaled)
    # Normalize scores to 0-1 anomaly probability (higher = more anomalous)
    norm_scores = 1 - (scores - scores.min()) / (scores.max() - scores.min() + 1e-9)

    anomaly_indices = [i for i, p in enumerate(predictions) if p == -1]
    latest_is_anomaly = predictions[-1] == -1
    latest_score = float(norm_scores[-1])

    return {
        "sensor_id": req.sensor_id,
        "is_anomaly": latest_is_anomaly,
        "anomaly_score": round(latest_score, 4),
        "anomaly_indices": anomaly_indices,
        "total_anomalies": len(anomaly_indices),
        "anomaly_rate": round(len(anomaly_indices) / len(req.readings), 4),
        "statistics": {
            "mean": round(float(np.mean(values)), 3),
            "std": round(float(np.std(values)), 3),
            "min": round(float(np.min(values)), 3),
            "max": round(float(np.max(values)), 3),
            "latest": round(float(values[-1]), 3),
        },
    }


# ─── Equipment Health Score ───────────────────────────────────────────────────
@app.post("/predict/health-score")
async def calculate_health_score(req: HealthScoreRequest):
    """Calculate composite health score (0-100) for equipment."""
    scores = []

    for sensor_name, readings in req.sensor_readings.items():
        if not readings:
            continue
        vals = np.array(readings)
        mean_val = np.mean(vals)
        std_val = np.std(vals)
        trend = np.polyfit(range(len(vals)), vals, 1)[0] if len(vals) > 2 else 0

        # Simple health component: penalize high variability and upward trend near limits
        cv = std_val / (abs(mean_val) + 1e-9)  # coefficient of variation
        score = max(0, 100 - cv * 50 - abs(trend) * 10)
        scores.append(min(100, score))

    if not scores:
        return {"equipment_id": req.equipment_id, "health_score": 50, "components": {}}

    overall = round(float(np.mean(scores)), 1)
    risk_level = "critical" if overall < 30 else "high" if overall < 50 else "medium" if overall < 70 else "low"

    return {
        "equipment_id": req.equipment_id,
        "health_score": overall,
        "risk_level": risk_level,
        "component_scores": {name: round(s, 1) for name, s in zip(req.sensor_readings.keys(), scores)},
        "recommendation": _get_recommendation(overall),
    }


def _get_recommendation(score: float) -> str:
    if score < 30:
        return "IMMEDIATE ACTION REQUIRED: Schedule emergency maintenance. Risk of imminent failure."
    elif score < 50:
        return "HIGH RISK: Schedule corrective maintenance within 48 hours. Monitor closely."
    elif score < 70:
        return "MODERATE RISK: Schedule preventive maintenance within 2 weeks. Increase monitoring frequency."
    elif score < 85:
        return "GOOD CONDITION: Continue regular maintenance schedule. Monitor as usual."
    else:
        return "EXCELLENT CONDITION: Equipment performing optimally. Maintain current schedule."


# ─── RUL (Remaining Useful Life) ─────────────────────────────────────────────
@app.post("/predict/rul")
async def predict_remaining_useful_life(req: RULRequest):
    """Estimate remaining useful life based on current value and degradation rate."""
    margin = req.max_threshold - req.current_value

    if margin <= 0:
        return {"sensor_id": req.sensor_id, "rul_days": 0, "urgency": "critical", "message": "Threshold already exceeded"}

    # If no degradation rate provided, estimate from DB readings
    rate = req.degradation_rate
    if rate is None:
        eng = get_engine()
        if eng:
            try:
                with eng.connect() as conn:
                    result = conn.execute(text(
                        "SELECT value, recorded_at FROM sensor_readings "
                        "WHERE sensor_id = :sid ORDER BY recorded_at DESC LIMIT 48"
                    ), {"sid": req.sensor_id})
                    rows = result.fetchall()
                if len(rows) >= 2:
                    values = [r[0] for r in rows]
                    # Linear regression to get trend (units per reading, convert to per day assuming 15min intervals)
                    x = np.arange(len(values))
                    slope = np.polyfit(x, values, 1)[0]
                    readings_per_day = 96  # 15-min intervals
                    rate = abs(slope) * readings_per_day
                else:
                    rate = 0.1
            except Exception:
                rate = 0.1
        else:
            rate = 0.1

    if rate <= 0:
        rul_days = 999
    else:
        rul_days = round(margin / rate, 1)

    urgency = "critical" if rul_days < 7 else "high" if rul_days < 30 else "medium" if rul_days < 90 else "low"

    return {
        "sensor_id": req.sensor_id,
        "current_value": req.current_value,
        "max_threshold": req.max_threshold,
        "margin": round(margin, 3),
        "degradation_rate_per_day": round(rate, 4),
        "rul_days": rul_days,
        "estimated_failure_date": (datetime.now() + timedelta(days=rul_days)).strftime("%Y-%m-%d") if rul_days < 999 else None,
        "urgency": urgency,
    }


# ─── Failure Prediction from DB ──────────────────────────────────────────────
@app.get("/predict/equipment/{equipment_id}")
async def predict_equipment_failure(equipment_id: int, days_ahead: int = 30):
    """Pull sensor data from DB and run predictions for an equipment."""
    eng = get_engine()
    if eng is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        with eng.connect() as conn:
            sensors = conn.execute(text(
                "SELECT id, name, sensor_type, unit, max_threshold, warning_max_threshold "
                "FROM sensors WHERE equipment_id = :eid AND active = 1"
            ), {"eid": equipment_id}).fetchall()

            if not sensors:
                return {"equipment_id": equipment_id, "predictions": [], "overall_risk": "unknown"}

            predictions = []
            risk_scores = []

            for s in sensors:
                sid, sname, stype, unit, max_thresh, warn_thresh = s
                readings = conn.execute(text(
                    "SELECT value FROM sensor_readings WHERE sensor_id = :sid "
                    "ORDER BY recorded_at DESC LIMIT 96"
                ), {"sid": sid}).fetchall()

                if not readings:
                    continue

                values = [r[0] for r in readings]
                current = values[0]
                mean_v = float(np.mean(values))
                std_v = float(np.std(values))

                # Trend analysis
                slope = 0.0
                if len(values) > 5:
                    x = np.arange(len(values))
                    slope = float(np.polyfit(x, values, 1)[0])

                # Anomaly score
                scaler = StandardScaler()
                arr = np.array(values).reshape(-1, 1)
                if arr.std() > 0:
                    scaled = scaler.fit_transform(arr)
                    iso = IsolationForest(contamination=0.05, random_state=42)
                    iso.fit(scaled)
                    raw_score = iso.score_samples([[scaler.transform([[current]])[0][0]]])[0]
                    anomaly_score = float(1 - (raw_score + 0.5))
                else:
                    anomaly_score = 0.0

                # RUL estimate
                readings_per_day = 96
                daily_rate = abs(slope) * readings_per_day
                rul = None
                if max_thresh and daily_rate > 0:
                    margin = max_thresh - current
                    rul = round(margin / daily_rate, 1) if margin > 0 else 0

                risk = anomaly_score * 0.4 + (min(1, daily_rate / (max_thresh or 100)) * 0.3) + (0 if rul is None or rul > 90 else (1 - rul / 90) * 0.3)
                risk_scores.append(risk)

                predictions.append({
                    "sensor_id": sid,
                    "sensor_name": sname,
                    "sensor_type": stype,
                    "unit": unit,
                    "current_value": round(current, 3),
                    "mean_24h": round(mean_v, 3),
                    "std_24h": round(std_v, 3),
                    "trend_direction": "increasing" if slope > 0.001 else "decreasing" if slope < -0.001 else "stable",
                    "anomaly_score": round(anomaly_score, 3),
                    "rul_days": rul,
                    "risk_score": round(risk, 3),
                    "max_threshold": max_thresh,
                })

        overall_risk_score = float(np.mean(risk_scores)) if risk_scores else 0
        overall_risk = "critical" if overall_risk_score > 0.7 else "high" if overall_risk_score > 0.4 else "medium" if overall_risk_score > 0.2 else "low"

        return {
            "equipment_id": equipment_id,
            "overall_risk": overall_risk,
            "overall_risk_score": round(overall_risk_score, 3),
            "predictions": predictions,
            "generated_at": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "prediction-engine"}
# ─── Maintenance Schedule Optimizer ──────────────────────────────────────────
@app.get("/predict/maintenance-schedule/{equipment_id}")
async def optimize_maintenance_schedule(equipment_id: int):
    """Suggest optimized maintenance intervals based on equipment health trends."""
    eng = get_engine()
    if eng is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        with eng.connect() as conn:
            equip = conn.execute(text(
                "SELECT id, name, criticality_level, next_maintenance_date FROM equipment WHERE id = :eid"
            ), {"eid": equipment_id}).fetchone()

            if not equip:
                raise HTTPException(status_code=404, detail="Equipment not found")

            schedules = conn.execute(text(
                "SELECT maintenance_type, frequency_days, last_performed, next_due "
                "FROM maintenance_schedules WHERE equipment_id = :eid AND active = 1"
            ), {"eid": equipment_id}).fetchall()

            anomaly_rate = conn.execute(text(
                "SELECT AVG(CAST(sr.anomaly AS FLOAT)) as rate "
                "FROM sensor_readings sr JOIN sensors s ON s.id = sr.sensor_id "
                "WHERE s.equipment_id = :eid AND sr.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            ), {"eid": equipment_id}).fetchone()

            anom_rate = float(anomaly_rate[0] or 0) if anomaly_rate else 0

        criticality_multiplier = {"low": 1.5, "medium": 1.0, "high": 0.75, "critical": 0.5}.get(equip[2] or "medium", 1.0)
        health_multiplier = 1.0 - (anom_rate * 0.5)  # reduce interval if many anomalies

        recommendations = []
        for sched in schedules:
            mtype, freq, last, next_due = sched
            adjusted_freq = max(7, round(freq * criticality_multiplier * health_multiplier))
            recommendations.append({
                "maintenance_type": mtype,
                "current_frequency_days": freq,
                "recommended_frequency_days": adjusted_freq,
                "last_performed": str(last) if last else None,
                "current_next_due": str(next_due) if next_due else None,
                "change": "reduce" if adjusted_freq < freq else "extend" if adjusted_freq > freq else "maintain",
            })

        return {
            "equipment_id": equipment_id,
            "equipment_name": equip[1],
            "criticality_level": equip[2],
            "anomaly_rate_30d": round(anom_rate, 4),
            "recommendations": recommendations,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "rigguard-prediction", "timestamp": datetime.now().isoformat()}
