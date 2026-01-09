"""FastAPI Application Entry Point"""

from fastapi import FastAPI

app = FastAPI(
    title="Fantasy F1 Backend API",
    description="Backend API for Fantasy F1 application",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Fantasy F1 Backend API", "version": "0.1.0"}