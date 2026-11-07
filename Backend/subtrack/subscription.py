from datetime import date
from typing import Annotated
from uuid import UUID

import psycopg
from fastapi import APIRouter, HTTPException, Depends, Form

from subtrack.db import connection
from subtrack.dependencies import current_user
from subtrack.services.validate import validate_text

router = APIRouter()
SUBSCRIPTION_CATEGORIES = {
    "Entertainment",
    "Productivity",
    "Utilities",
    "Education",
    "Health & Fitness",
    "Shopping",
    "Other",
}

def validate_category(category: str) -> str:
    if category not in SUBSCRIPTION_CATEGORIES:
        raise HTTPException(422, "Choose a valid category")
    return category

@router.get("/subs") # READ = Get the subs list for the specific user_id | -> App.jsx (useEffect) FETCH -> SubsList.jsx PRINT
def list_subs(user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur: # return the data into dictionaries and not tuples
        cur.execute("select * from subs where user_id = %s order by updated_at desc", (user_id,))
        return cur.fetchall()

@router.get("/subs/price-history")
def list_price_history(user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute(
            "select history.subs_id, history.price, history.duration, history.effective_at "
            "from sub_price_history as history "
            "join subs on subs.id = history.subs_id "
            "where history.user_id = %s and subs.user_id = %s "
            "order by history.effective_at, history.subs_id",
            (user_id, user_id),
        )
        return cur.fetchall()

@router.post("/subs", status_code = 201) # CREATE = post new sub | -> APP.jsx 
async def create_subs(
    names: Annotated[str, Form()],
    price: Annotated[float, Form()],
    startd: Annotated[date, Form()],
    duration: Annotated[int, Form()],
    user_id: Annotated[UUID, Depends(current_user)],
    category: Annotated[str, Form()] = "Other",
):
    names = validate_text(names)
    category = validate_category(category)
    try:
        with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
            cur.execute("insert into subs (names, price, startd, duration, user_id, category) values (%s, %s, %s, %s, %s, %s) returning *", (names, price, startd, duration, user_id, category),
            )
            row = cur.fetchone()
            cur.execute(
                "insert into sub_price_history (subs_id, user_id, price, duration) values (%s, %s, %s, %s)",
                (row["id"], user_id, price, duration),
            )
            return row
    except Exception:
        raise

@router.put("/subs/{subs_id}") # UPDATE = edit sub | -> APP.jsx
async def update_subs(
    subs_id: UUID,
    names: Annotated[str, Form()],
    price: Annotated[float, Form()],
    startd: Annotated[date, Form()],
    duration: Annotated[int, Form()],
    user_id: Annotated[UUID, Depends(current_user)],
    category: Annotated[str, Form()] = "Other",
):
    names = validate_text(names)
    category = validate_category(category)
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select * from subs where id = %s and user_id = %s for update", (subs_id, user_id))
        old = cur.fetchone()
        if old is None: # check if the row exist, then update the row
            raise HTTPException(404, "Subscription Not Found")
        cur.execute("update subs set names = %s, price = %s, startd = %s, duration = %s, category = %s, updated_at = now() where id = %s and user_id = %s returning *",
                    (names, price, startd, duration, category, subs_id, user_id),
        )
        row = cur.fetchone()
        if float(old["price"]) != price or old["duration"] != duration:
            cur.execute(
                "insert into sub_price_history (subs_id, user_id, price, duration) values (%s, %s, %s, %s)",
                (subs_id, user_id, price, duration),
            )
    return row

@router.delete("/subs/{subs_id}", status_code = 204) # DELETE = delete sub | -> App.jsx (deleteSubscription)
def delete_subs(subs_id: UUID, user_id: Annotated[UUID, Depends(current_user)]):
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select * from subs where id = %s and user_id = %s for update", (subs_id, user_id)) # get the sub that existed for the user only
        row = cur.fetchone()
        if row is None:
            raise HTTPException(404, "Subscription Not Found")
        cur.execute("delete from subs where id = %s and user_id = %s", (subs_id, user_id))
