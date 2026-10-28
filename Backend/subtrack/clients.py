from supabase import create_client

from subtrack.config import settings

store_client = create_client(settings.supabase_url, settings.supabase_service_role_key)
# result = store_client.auth.sign_in_with_password({ # swagger authentication
#     "email": "cheatcafe69@gmail.com", "password": "admin1234"
# })
# print(result.session.access_token) # print the access token for the particular user