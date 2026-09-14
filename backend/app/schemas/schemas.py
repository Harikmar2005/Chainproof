# Schema definitions for the ChainProof API

from pydantic import BaseModel, Field
from typing import List, Optional

class ScanRequest(BaseModel):
    """Request schema for scanning an image."""
    image: str = Field(..., min_length=1, description="Base64‑encoded image data to be scanned")

class Vulnerability(BaseModel):
    """Individual vulnerability entry."""
    id: str = Field(..., description="Unique identifier for the vulnerability")
    severity: str = Field(..., description="Severity level (e.g., low, medium, high)")
    package: Optional[str] = Field(None, description="Package name where the vulnerability was found")
    version: Optional[str] = Field(None, description="Package version")
