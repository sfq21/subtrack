from typing import Annotated
from uuid import UUID
from datetime import date, timedelta

import psycopg
from fastapi import APIRouter, Depends, HTTPException

from subtrack.db import connection
from subtrack.dependencies import current_user

router = APIRouter()

@router.get("/alerts") # READ = get alerts for subs which user_id is same as current user uuid
def list_alerts(user_id: Annotated[UUID, Depends(current_user)]):
    today = date.today() # get today data
    with connection() as conn, conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
        cur.execute("select id, names, startd, duration from subs where user_id = %s", (user_id,)) # get the subs belongs to the user
        subs = cur.fetchall()

        alerts = [] # create empty list and assign it to alerts
        for sub in subs: # for loops for each sub in subs table
            end = sub["startd"] + timedelta(days=sub["duration"]) # sub start data + duration and assign it to end
            days_until_end = (end - today).days # end - today and return it the value in days
            if 0 <= days_until_end <= 7: # if the remaining date le to 3 days and ge to 0
                timing = "today" if days_until_end == 0 else f"in {days_until_end} days" # assign timing as today if days_until_end is 0 else assign f string
                descr = f"{sub['names']} ends on {end} ({timing})." # assign f string into descr to be insert in table

                cur.execute( # check if there's a row created today
                    "select * from alerts where subs_id = %s and alert_date::date = %s",
                    (sub["id"], today),
                )
                row = cur.fetchone()
                if row is None: # check if the row is None, create a new row
                    cur.execute(
                        "insert into alerts (subs_id, user_id, descr) values (%s, %s, %s) returning *",
                        (sub["id"], user_id, descr),
                    )
                    row = cur.fetchone()
                else: # If there's already one, update the row
                    cur.execute(
                        "update alerts set descr = %s where id = %s returning *",
                        (descr, row["id"]),
                    )
                    row = cur.fetchone()
                alerts.append(row)
    
        conn.commit()

    return {"alerts": alerts} # return alerts table is alerts which are created as empty list