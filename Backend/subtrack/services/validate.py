from fastapi import HTTPException

def validate_text(names: str) -> str:
    names = names.strip()
    if not 1 <= len(names) <= 160:
        raise HTTPException(422, "Name must be 1–160 characters")
    return names