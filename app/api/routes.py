from fastapi import APIRouter
from app.services.dns_service import get_ips
from app.services.geo_service import get_location

router = APIRouter()

@router.get("/track")
async def track(domain: str):
    ips = get_ips(domain)
    results = []

    for ip in ips:
        location = await get_location(ip)
        results.append({
            "ip": ip,
            "location": location
        })

    return results