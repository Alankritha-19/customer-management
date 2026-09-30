from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/lead", status_code=status.HTTP_403_FORBIDDEN)
async def webhook_lead():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Webhook endpoint is disabled for this version. Customers submit enquiries directly through the application's Customer Portal API."
    )

