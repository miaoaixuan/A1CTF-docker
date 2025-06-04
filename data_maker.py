import uuid
import random

def create_teams(count: int):
    for i in range(count):
        template = f"INSERT INTO public.teams (game_id,team_name,team_avatar,team_slogan,team_description,team_members,team_score,team_hash,invite_code,team_status,group_id) VALUES (1,'team_{i}',NULL,'','','{{{uuid.uuid4()}}}',0.0,'{random.randint(1, 1000000000000000000)}','test114514_{random.randint(1, 1000000000000000000)}','\"Approved\"',NULL);"
        print(template)

create_teams(2000)