from datetime import date
from typing import Annotated
from uuid import UUID

import psycopg
from fastapi import APIRouter, HTTPException, Depends, Form

from subtrack.db import connection
from subtrack.dependencies import current_user
from subtrack.services.validate import validate_text

router = APIRouter()

@router.get("/subs") # READ = Get the subs list for the specific user_id | -> App.jsx (useEffect) FETCH -> SubsList.jsx PRINT
def list_subs(user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur: # return the data into dictionaries and not tuples
        cur.execute("select * from subs where user_id = %s order by updated_at desc", (user_id,))
        return cur.fetchall()

@router.post("/subs", status_code = 201) # CREATE = post new sub | -> APP.jsx 
async def create_subs(
    names: Annotated[str, Form()],
    price: Annotated[float, Form()],
    startd: Annotated[date, Form()],
    duration: Annotated[int, Form()],
    user_id: Annotated[UUID, Depends(current_user)]
):
    names = validate_text(names)
    try:
        with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute("insert into subs (names, price, startd, duration, user_id) values (%s, %s, %s, %s, %s) returning *", (names, price, startd, duration, user_id),
            )
            return cur.fetchone()
    except Exception:
        raise

@router.put("/subs/{subs_id}") # UPDATE = edit sub | -> APP.jsx
async def update_subs(
    subs_id: UUID,
    names: Annotated[str, Form()],
    price: Annotated[float, Form()],
    startd: Annotated[date, Form()],
    duration: Annotated[int, Form()],
    user_id: Annotated[UUID, Depends(current_user)]
):
    names = validate_text(names)
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select * from subs where id = %s and user_id = %s for update", (subs_id, user_id))
        old = cur.fetchone()
        if old is None: # check if the row exist, then update the row
            raise HTTPException(404, "Subscription Not Found")
        cur.execute("update subs set names = %s, price = %s, startd = %s, duration = %s, updated_at = now() where id = %s and user_id = %s returning *",
                    (names, price, startd, duration, subs_id, user_id),
        )
        row = cur.fetchone()
    return row

@router.delete("/subs/{subs_id}", status_code = 204) # DELETE = delete sub | -> App.jsx (deleteSubscription)
def delete_subs(subs_id: UUID, user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select * from subs where id = %s and user_id = %s for update", (subs_id, user_id)) # get the sub that existed for the user only
        row = cur.fetchone()
        if row is None:
            raise HTTPException(404, "Subscription Not Found")
        cur.execute("delete from subs where id = %s and user_id = %s", (subs_id, user_id))
