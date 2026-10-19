from typing import Annotated
from uuid import UUID
from datetime import date, timedelta

import psycopg
from fastapi import APIRouter, Depends, HTTPException

from subtrack.db import connection
from subtrack.dependencies import current_user

router = APIRouter()

@router.get("/alerts") # READ = get alerts when nearing expiration
def list_alerts(user_id: Annotated[UUID, Depends(current_user)]):
    today = date.today() # get today data
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select id, names, startd, duration from subs where user_id = %s", (user_id,))
        subs = cur.fetchall()

        alerts = []
        for sub in subs:
            end = sub["startd"] + timedelta(days=sub["duration"])
            days_until_end = (end - today).days
            if 0 <= days_until_end <= 3:
                timing = "today" if days_until_end == 0 else f"in {days_until_end} days"
                descr = f"{sub['names']} ends on {end} ({timing})."

                cur.execute(
                    "select * from alerts where subs_id = %s and alert_date::date = %s",
                    (sub["id"], today),
                )
                row = cur.fetchone()
                if row is None:
                    cur.execute(
                        "insert into alerts (subs_id, user_id, descr) values (%s, %s, %s) returning *",
                        (sub["id"], user_id, descr),
                    )
                    row = cur.fetchone()
                else:
                    cur.execute(
                        "update alerts set descr = %s where id = %s returning *",
                        (descr, row["id"]),
                    )
                    row = cur.fetchone()
                alerts.append(row)
    
        conn.commit()

    return {"alerts": alerts}