# D360° Privacy Assessment — AlignData
Diagnóstico de cumplimiento Ley 21.719 · Desplegable en Cloud Run

## Estructura del proyecto

```
d360-app/
├── server.js          # Express — sirve archivos estáticos
├── package.json
├── Dockerfile
├── .dockerignore
└── public/
    ├── index.html     # HTML limpio (sin CSS ni JS inline)
    ├── styles.css     # Todos los estilos
    └── app.js         # Lógica completa del assessment
```

## Deploy en Cloud Run (paso a paso)

### Prerrequisitos
```bash
# Instalar gcloud CLI si no está instalado
# https://cloud.google.com/sdk/docs/install

gcloud auth login
gcloud config set project aligndata-arcop-portal
```

### Opción A — Deploy directo desde código fuente (sin Docker local)
```bash
cd d360-app

gcloud run deploy d360-assessment \
  --source . \
  --region southamerica-west1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

### Opción B — Build manual con Docker + Artifact Registry
```bash
# 1. Configurar Artifact Registry (solo primera vez)
gcloud artifacts repositories create d360 \
  --repository-format=docker \
  --location=southamerica-west1

# 2. Autenticar Docker
gcloud auth configure-docker southamerica-west1-docker.pkg.dev

# 3. Build y push
PROJECT=aligndata-arcop-portal
REGION=southamerica-west1
IMAGE=$REGION-docker.pkg.dev/$PROJECT/d360/assessment:latest

docker build -t $IMAGE .
docker push $IMAGE

# 4. Deploy
gcloud run deploy d360-assessment \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

### Opción C — Deploy vía PowerShell (Windows)
```powershell
cd d360-app

gcloud run deploy d360-assessment `
  --source . `
  --region southamerica-west1 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 256Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 3
```

## Desarrollo local
```bash
cd d360-app
npm install
npm start
# Abre http://localhost:8080
```

## Notas
- El frontend es 100% estático (HTML/CSS/JS) — no necesita backend para funcionar.
- El servidor Express solo sirve archivos estáticos y hace SPA fallback.
- localStorage persiste el progreso del usuario entre sesiones.
- Para conectar Firebase Firestore en el futuro, modificar solo `app.js`.
