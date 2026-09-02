from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NER Landslide Early Warning API",
    description="AI-powered landslide monitoring and early warning backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "NER Landslide Monitoring API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }