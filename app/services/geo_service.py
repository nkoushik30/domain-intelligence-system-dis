import httpx

async def get_location(ip):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"http://ip-api.com/json/{ip}")
        return res.json()