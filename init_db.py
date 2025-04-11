import requests


session = requests.Session()

# 注册账号
print("注册账号")
res = session.post(
    url="http://localhost:7777/api/auth/register",
    json={
        "username": "root",
        "password": "root",
        "captcha": "",
        "email": "22233@qq.com",
    },
)
print(res.text)

print("登录账号")
res = session.post(
    url="http://localhost:3000/api/auth/login",
    json={"username": "root", "password": "root"},
)

print(res.text)

# 创建题目
problems = [["CRYPTO", "密码测试1"], ["WEB", "WEB测试1"], ["REVERSE", "REVERSE测试1"]]

for item in problems:
    print("创建题目", item[1])
    res = session.post(
        url="http://localhost:3000/api/admin/challenge/create",
        json={
            "attachments": [],
            "category": item[0],
            "challenge_id": 0,
            "container_config": [],
            "create_time": "2025-04-11T06:09:04.721Z",
            "description": "",
            "judge_config": {
                "judge_type": "DYNAMIC",
                "judge_script": "",
                "flag_template": "",
            },
            "name": item[1],
            "type_": 0,
        },
    )
    print(res.text)


# 创建比赛
print("创建比赛")
res = session.post(
    url="http://localhost:3000/api/admin/game/create",
    json={
        "game_id": 0,
        "name": "测试比赛1",
        "summary": "",
        "description": "",
        "poster": "",
        "invite_code": "",
        "start_time": "2025-04-11T06:12:41.147Z",
        "end_time": "2025-04-11T06:12:41.147Z",
        "practice_mode": False,
        "team_number_limit": 3,
        "container_number_limit": 3,
        "require_wp": False,
        "wp_expire_time": "2025-04-11T06:12:41.147Z",
        "stages": [],
        "visible": False,
        "challenges": [],
    },
)

print(res.text)

print("添加题目")

for _ in range(1, 4):
    res = session.put(
        url=f"http://localhost:3000/api/admin/game/1/challenge/{_}",
    )

    print(f"题目{_}", res.text)
