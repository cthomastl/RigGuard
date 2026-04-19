# RigGuard

Predictive maintenance platform for oil & gas operations. Monitors equipment health, detects anomalies, and forecasts failures before they happen.

## What It Does

- **Equipment monitoring** — tracks sensors across rigs in real time
- **Anomaly detection** — ML-based isolation forest flags abnormal readings
- **Remaining Useful Life (RUL)** — estimates how long equipment will last
- **Alerts & work orders** — auto-generates maintenance tasks from predictions
- **Inspection scheduling** — optimizes maintenance intervals per asset

## Repository Structure

```
ui/                          # React + TypeScript frontend (deployed to S3)
services/
  services/api/              # Node.js + Express REST API
  services/prediction/       # Python + FastAPI ML service
infra/
  k8s/                       # Kubernetes manifests
  terraform/                 # AWS infrastructure (EKS, VPC)
.github/
  workflows/                 # GitHub Actions (frontend deploy to S3)
```

## Infrastructure

- **Cloud**: AWS (us-east-2)
- **Kubernetes**: EKS Auto Mode (v1.33)
- **Database**: Amazon RDS MySQL
- **Container Registry**: Amazon ECR
- **Frontend Hosting**: S3
- **Ingress**: nginx ingress controller with internet-facing AWS NLB

## Services

| Service | Language | Port | Description |
|---------|----------|------|-------------|
| API | Node.js 20 + TypeScript | 3001 | REST API, auth, data management |
| Prediction | Python 3.11 + FastAPI | 8000 | ML inference, anomaly detection |
| Frontend | React + Vite | — | Dashboard UI, deployed to S3 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate |
| GET | `/api/dashboard/summary` | Dashboard KPIs |
| GET | `/api/equipment` | List all equipment |
| GET | `/api/equipment/:id` | Equipment detail with sensors |
| POST | `/api/sensors/:id/readings` | Ingest sensor reading |
| GET | `/api/sensors/:id/readings` | Historical readings |
| GET | `/api/alerts` | List alerts |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/inspections` | List inspections |
| POST | `/api/work-orders` | Create work order |

## Prediction Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/predict/equipment/:id` | Full equipment risk analysis |
| POST | `/predict/anomaly` | Anomaly detection on readings |
| POST | `/predict/rul` | Remaining Useful Life estimate |
| GET | `/predict/maintenance-schedule/:id` | Optimized maintenance intervals |

## Kubernetes Deployment

### Prerequisites
- AWS CLI configured
- kubectl
- Helm
- Terraform

### 1. Provision Infrastructure

```bash
cd infra/terraform
terraform init
terraform apply
```

### 2. Connect kubectl

```bash
aws eks update-kubeconfig --region us-east-2 --name rigguard-cluster
```

### 3. Install nginx Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-scheme"=internet-facing
```

### 4. Create Kubernetes Secret

```bash
kubectl create secret generic rigguard-secret -n rigguard \
  --from-literal=DB_HOST="your-rds-hostname" \
  --from-literal=DB_PASSWORD="your-db-password" \
  --from-literal=JWT_SECRET="your-jwt-secret"
```

### 5. Apply Manifests

```bash
kubectl apply -f infra/k8s/
```

### 6. Verify

```bash
kubectl get pods -n rigguard
kubectl get ingress -n rigguard
```

Health checks:
- `http://<EXTERNAL-IP>/api/health`
- `http://<EXTERNAL-IP>/predict/health`

## Frontend Deployment (GitHub Actions)

Pushing to the default branch triggers `.github/workflows/deploy.yml` which builds the React app and syncs it to S3.

Required GitHub secrets:

| Secret | Description |
|--------|-------------|
| `VITE_API_URL` | LoadBalancer URL |
| `VITE_PREDICTION_URL` | LoadBalancer URL |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |

## Local Development

```bash
cp .env.example .env
# Fill in your RDS credentials

docker compose up
```

- API: http://localhost:3001
- Prediction service: http://localhost:8000

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Team members with roles (admin, engineer, technician, inspector) |
| `equipment` | Assets with status and criticality |
| `sensors` | Sensor config and thresholds per equipment |
| `sensor_readings` | Time-series data with anomaly flags |
| `alerts` | Auto-generated or manual, with acknowledge/resolve workflow |
| `inspections` | Scheduled inspections with checklists |
| `work_orders` | Linked to equipment, alerts, and inspections |
| `maintenance_schedules` | Recurring schedules per asset |

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@rigguard.com | Password123! | Admin |
| engineer@rigguard.com | Password123! | Engineer |
| tech@rigguard.com | Password123! | Technician |
| inspector@rigguard.com | Password123! | Inspector |
