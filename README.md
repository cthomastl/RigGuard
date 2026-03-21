# RigGuard — Oil & Gas Predictive Maintenance Platform

Full-stack web application for predictive maintenance and inspection workflow management in oil & gas operations.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   React Frontend │────▶│  Node.js API     │────▶│   AWS RDS MySQL   │
│   (Vite + TS)   │     │  (Express + ORM) │     │                   │
│   Port 80       │     │  Port 3001       │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
                              │
                         ┌────▼─────────────┐
                         │ Python Prediction │
                         │ Service (FastAPI) │
                         │ Port 8000         │
                         └──────────────────┘
```

## Services

### Frontend (React + TypeScript + Tailwind)
- Dashboard with fleet health score & KPIs
- Equipment registry with real-time sensor charts
- Alert management (acknowledge/resolve workflow)
- Inspection scheduling & completion workflow
- Work order creation & status management
- AI predictions (RUL, anomaly scores per equipment)
- User management

### API Service (Node.js + Express + Sequelize)
- REST API with JWT authentication
- Equipment, Sensors, Alerts, Inspections, Work Orders, Users
- Auto-syncs Sequelize models to MySQL on startup
- Threshold-based alert generation on sensor ingestion

### Prediction Service (Python + FastAPI + scikit-learn)
- Isolation Forest anomaly detection
- Remaining Useful Life (RUL) estimation
- Composite risk scoring per equipment
- Maintenance schedule optimization

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your AWS RDS MySQL credentials
```

### 2. Launch with Docker Compose

```bash
docker compose up -d
```

### 3. Seed the Database (first time)

```bash
docker compose exec api npm run seed
```

### 4. Access the App

Open http://localhost in your browser.

**Demo Credentials:**
| Email | Password | Role |
|-------|----------|------|
| admin@rigguard.com | Password123! | Admin |
| engineer@rigguard.com | Password123! | Engineer |
| tech@rigguard.com | Password123! | Technician |
| inspector@rigguard.com | Password123! | Inspector |

## Database Schema

- **users** — Team members with roles (admin, engineer, technician, inspector)
- **equipment** — Oil & gas assets with status and criticality tracking
- **sensors** — Sensors attached to equipment with threshold configurations
- **sensor_readings** — Time-series sensor data with anomaly flags
- **alerts** — Auto-generated or manual alerts with acknowledge/resolve workflow
- **inspections** — Scheduled inspections with checklists and findings
- **work_orders** — Maintenance work orders linked to equipment/alerts/inspections
- **maintenance_schedules** — Recurring maintenance schedules per equipment

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Authenticate |
| GET | /api/dashboard/summary | Dashboard KPIs |
| GET | /api/equipment | List all equipment |
| GET | /api/equipment/:id | Equipment detail with sensors |
| POST | /api/sensors/:id/readings | Ingest sensor reading |
| GET | /api/sensors/:id/readings | Historical readings |
| GET | /api/alerts | List alerts |
| POST | /api/alerts/:id/acknowledge | Acknowledge alert |
| GET | /api/inspections | List inspections |
| POST | /api/inspections | Schedule inspection |
| GET | /api/work-orders | List work orders |
| POST | /api/work-orders | Create work order |

## Prediction API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /predict/equipment/:id | Full equipment risk analysis |
| POST | /predict/anomaly | Anomaly detection on readings |
| POST | /predict/rul | Remaining Useful Life estimate |
| GET | /predict/maintenance-schedule/:id | Optimized maintenance intervals |

## AWS RDS Notes

- SSL is enabled by default (`DB_SSL=true`)
- Ensure your RDS security group allows inbound 3306 from your EC2/ECS instances
- The API service auto-creates/migrates tables on startup via Sequelize `sync()`
- For production, set `NODE_ENV=production` to disable `sync({ alter: true })`
