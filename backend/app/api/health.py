from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Health check",
    description="Returns the API status and confirms the server is running.",
)
async def health_check():
    return {"status": "healthy", "service": "dmics-api"}
