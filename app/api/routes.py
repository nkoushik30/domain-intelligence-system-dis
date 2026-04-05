from fastapi import APIRouter, HTTPException
from app.services.dns_service import get_ips
from app.services.geo_service import get_location

router = APIRouter()

@router.get("/track")
async def track_domain(domain: str):
    try:
        ips = get_ips(domain)

        results = []
        for ip in ips:
            location = await get_location(ip)   # MUST await
            results.append({
                "ip": ip,
                "location": location
            })

        return results

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))