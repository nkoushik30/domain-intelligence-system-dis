from pydantic import BaseModel

class DomainResponse(BaseModel):
    ip: str
    country: str
    city: str
    isp: str