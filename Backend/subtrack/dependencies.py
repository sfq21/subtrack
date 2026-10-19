from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from subtrack.clients import store_client

bearer_scheme = HTTPBearer(auto_error=False)

def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> UUID:
    try:
        user = store_client.auth.get_user(credentials.credentials).user
        if user is None:
            raise HTTPException(401, "Missing User")
        return UUID(str(user.id))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(401, "Session expired or invalid. Sign in again.") from exc

# def current_user(authorization: Annotated[str | None, Header()] = None) -> UUID:
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(401, "Sign in to continue")
#     try:
#         user = store_client.auth.get_user(authorization[7:]).user
#         if user is None:
#             raise ValueError("Missing User")
#         return UUID(str(user.id))
#     except Exception as exc:
#         raise HTTPException(401, "Session expired, Please sign in again") from exc