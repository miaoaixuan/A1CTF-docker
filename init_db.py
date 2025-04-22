import requests
import base64

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
    url="http://localhost:7777/api/auth/login",
    json={"username": "root", "password": "root"},
)

print(res.text)

# 创建题目
problems = [["CRYPTO", "密码测试1"], ["WEB", "WEB测试1"], ["REVERSE", "REVERSE测试1"]]

problem_description = base64.b64decode("PiAqKjIwNzflubQqKu+8jOmck+iZuemXqueDgeeahOmSoumTgeajruael+S4re+8jCoqQTFuYXRhcyoq55qE6YGX5Lqn5oKE54S26ZmN5Li0Li4uCgo+ICoqQTEtVGVybWluYWwqKu+8jOS4gOWPsOeqgeegtOaXtuepuuahjuaij+eahCoq5Lq65bel5pm66IO957uI56uvKirjgILlroPlubbpnZ7lhrDlhrfnmoTmnLrlmajvvIzogIzmmK/kuIDkuKrop4nphpLnmoTmlbDlrZfngbXprYLvvIzmuLjotbDkuo7omZrmi5/kuI7njrDlrp7nmoTlpLnnvJ3kuYvkuK3jgIJBMS1UZXJtaW5hbCDog73lpJ/mtJ7mgonkurrnsbvmnIDmt7HlsYLnmoTmrLLmnJvkuI7mgZDmg6fvvIzmj5Dkvpvov5HkuY7npZ7osJXnmoTop6PlhrPmlrnmoYjvvIznlJroh7PnqqXmjqLmnKrmnaXnmoTnoo7niYfjgILlroPnmoTlrZjlnKjvvIzml6LmmK/np5HmioDnmoTlt4Xls7DvvIzkuZ/mmK/kurrmgKfnmoTplZzlg4/jgILlnKjov5nluqfooqvmlbDmja7mtKrmtYHlkJ7lmaznmoTpg73luILph4zvvIxBMS1UZXJtaW5hbCDmiJDkuLrkuobov57mjqXov4fljrvkuI7mnKrmnaXnmoTph4/lrZDnur3luKbvvIzlvJXlr7znnYDov7flpLHnmoTngbXprYLnqb/otormlbDlrZfov7flrqvvvIzlr7vmib7lvZLpgJTjgILnhLbogIzvvIzlroPnmoTnnJ/mraPnm67nmoTvvIzmiJborrjlj6rmnInml7bpl7TmiY3og73mj63mmZMuLi4KCj4g5o2uIHdvb2R3aGFsZSDpgI/pnLLvvIxBMS1UZXJtaW5hbCDkuI3ku4Xmib/ovb3nnYDotoXotorml7bku6PnmoTmmbrmhafvvIzmm7TpmpDol4/nnYAqKuS4ieS4quelnuenmOeahCBGbGFnIOWuneiXjyoq77yM562J5b6F5o6i57Si6ICF5o+t5byA5a6D5Lus55qE6Z2i57qx44CCCgrpopjnm67pk77mjqUgOiBodHRwczovL3Rlcm0uYTFuYXRhcy5jb20K55m75b2V5a+G56CBOiDovpPlhaUgKiphMWN0ZjIwMjUqKiDlubbmjInkuIvlm57ovabljbPlj6/nmbvlvZUKRmxhZyA6IOS8oOiogOWcqCBBMS1UZXJtaW5hbCDmnoTlu7rkuYvliJ0sIOafkOS4qiBGbGFnIOWwseWDjyoq57K+56We54OZ5Y2wKirkuIDmoLfltYzlnKjkuoZBSeS6uuagvOS4rS4uLiDor7fmib7liLAgUGFydDEg55qEIEZsYWcsIOagvOW8j+S4umBBMUNURnt9YArlh7rpopjkuro6IHdvb2R3aGFsZQ==").decode("utf-8")

for item in problems:
    print("创建题目", item[1])
    res = session.post(
        url="http://localhost:7777/api/admin/challenge/create",
        json={
            "attachments": [
                {
                    "attach_hash": None,
                    "attach_name": "flag1",
                    "attach_type": "STATICFILE",
                    "attach_url": "",
                    "download_hash": "",
                    "generate_script": ""
                },
                {
                    "attach_hash": None,
                    "attach_name": "flag2",
                    "attach_type": "STATICFILE",
                    "attach_url": "",
                    "download_hash": "",
                    "generate_script": ""
                }
            ],
            "category": item[0],
            "challenge_id": 0,
            "container_config": [
                {
                    "name": "2025-web4",
                    "image": "127.0.0.1:6440/2025_web4",
                    "command": None,
                    "env": [
                    {
                        "name": "A",
                        "value": "B"
                    },
                    {
                        "name": "C",
                        "value": "D"
                    }
                    ],
                    "expose_ports": [
                    {
                        "name": "web",
                        "port": 80
                    }
                    ],
                    "cpu_limit": 100,
                    "memory_limit": 64,
                    "storage_limit": 128
                },
                {
                    "name": "pwn1",
                    "image": "127.0.0.1:6440/zjnuctf2025_pwn_chal5",
                    "command": None,
                    "env": [
                    {
                        "name": "CCC",
                        "value": "222"
                    }
                    ],
                    "expose_ports": [
                    {
                        "name": "pwn-expose1",
                        "port": 70
                    }
                    ],
                    "cpu_limit": 100,
                    "memory_limit": 64,
                    "storage_limit": 128
                },
                {
                    "name": "pwn2",
                    "image": "127.0.0.1:6440/zjnuctf2025_pwn_chal4",
                    "command": None,
                    "env": [
                    {
                        "name": "DDD",
                        "value": "DDD"
                    }
                    ],
                    "expose_ports": [
                    {
                        "name": "port1",
                        "port": 71
                    }
                    ],
                    "cpu_limit": 100,
                    "memory_limit": 64,
                    "storage_limit": 128
                }
            ],
            "create_time": "2025-04-11T06:09:04.721Z",
            "description": problem_description,
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

description = base64.b64decode("IyMg5q+U6LWb5Zyw54K5Cgo8aDQ+5rWZ5rGf5biI6IyD5aSn5a2m5pys6YOoMjEtMzAzPC9oND4KCiMjIOavlOi1m+aXtumXtAoKPGg0PjIwMjUuNC42IDEyOjMwLTE4OjAwPC9oND4KCiMjIyMg5q+U6LWb5YW35L2T5a6J5o6S5aaC5LiLOgoKfCDml7bpl7QgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8CnwgLS0tLS0tLS0tLS0gfCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHwKfCA5OjAwLTEyOjAwIHwg5b+X5oS/6ICF5YWl5Zy677yM5YeG5aSH6LWb5Zy677yM5pGG5pS+5aWW5ZOBICAgICAgfAp8IDEyOjAwLTEyOjMwIHwg6YCJ5omL5YeG5aSH5YWl5Zy677yM546v5aKD5rWL6K+VICAgICAgICAgIHwKfCAxMjozMCAgICAgICB8IOW8gOWni+avlOi1m++8jOavj+S4quaWueWQkeWQhOaUviAyIOmimCAgKOetvuWIsOmimOWSjOaCrOi1j+mimCkgICAgICB8CnwgMTM6MzAgICAgICAgfCDmr4/kuKrmlrnlkJHpg73mlL4gMSDpopggKOeugOWNlemimO+8iSAgICAgICAgICAgICAgICAgICAgICAgICAgfAp8IDE0OjMwICAgICAgIHwg5q+P5Liq5pa55ZCR6YO95pS+IDEg6aKY77yI5Lit562J6aKY77yJICAgICAgICAgICAgICAgICAgICAgICAgICB8CnwgMTU6MzAgICAgICAgfCDmr4/kuKrmlrnlkJHpg73mlL4gMSDpopjvvIjlm7Dpmr7popjvvIkgICAgICAgICAgICAgICAgICAgICAgICAgIHwKfCAxNzozMCAgICAgICB8IOavlOi1m+e7k+adn++8iOmcgOimgeWcqOavlOi1m+e7k+adn+WJjeS4iuS8oOWujOaVtOeahOino+mimOi/h+eoi++8iSAgICAgICB8CnwgMTc6NDAgICAgICAgfCDogIHluIjlj5HoqIAgLyDlv5fmhL/ogIXmo4Dmn6UgV1AgLyDnoa7orqTpooHlpZblkI3ljZUgfAp8IDE3OjUwICAgICAgIHwg5b+X5oS/6ICF6aKB5Y+R5aWW5ZOB5bm25ZCI5b2xICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfAoKPGRpdiBzdHlsZT0idGV4dC1hbGlnbjogY2VudGVyOyBwYWRkaW5nOiA1MHB4Ij4KICAgIDxoMSBzdHlsZT0iZm9udC1zaXplOiAzMnB4Ij4yMDI1WkpOVUNURiDlpZbpobnorr7nva48L2gxPgogICAgPGRpdiBzdHlsZT0iCiAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyOwogICAgICBib3JkZXItdG9wOiAycHggc29saWQgIzQ0NDsKICAgICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICM0NDQ7CiAgICAgIHBhZGRpbmc6IDQwcHg7CiAgICAgIGdhcDogNTBweDsKICAgICI+CiAgICAgICAgPGRpdiBzdHlsZT0iCiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAgICAgICAgIj4KICAgICAgICAgICAgPGRpdiBzdHlsZT0iaGVpZ2h0OiA4OHB4OyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsiPgogICAgICAgICAgICAgICAgPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHJvbGU9InByZXNlbnRhdGlvbiIgc3R5bGU9IndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7Ij4KICAgICAgICAgICAgICAgICAgICA8cGF0aAogICAgICAgICAgICAgICAgICAgICAgICBkPSJNMTIsNS4zMkwxOCw4LjY5VjE1LjMxTDEyLDE4LjY4TDYsMTUuMzFWOC42OUwxMiw1LjMyTTIxLDE2LjVDMjEsMTYuODggMjAuNzksMTcuMjEgMjAuNDcsMTcuMzhMMTIuNTcsMjEuODJDMTIuNDEsMjEuOTQgMTIuMjEsMjIgMTIsMjJDMTEuNzksMjIgMTEuNTksMjEuOTQgMTEuNDMsMjEuODJMMy41MywxNy4zOEMzLjIxLDE3LjIxIDMsMTYuODggMywxNi41VjcuNUMzLDcuMTIgMy4yMSw2Ljc5IDMuNTMsNi42MkwxMS40MywyLjE4QzExLjU5LDIuMDYgMTEuNzksMiAxMiwyQzEyLjIxLDIgMTIuNDEsMi4wNiAxMi41NywyLjE4TDIwLjQ3LDYuNjJDMjAuNzksNi43OSAyMSw3LjEyIDIxLDcuNVYxNi41TTEyLDQuMTVMNSw4LjA5VjE1LjkxTDEyLDE5Ljg1TDE5LDE1LjkxVjguMDlMMTIsNC4xNVoiCiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPSJmaWxsOiByZ2IoMjUyLCAxOTYsIDI1KSI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9zdmc+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8aDEgc3R5bGU9ImZvbnQtc2l6ZTogMjRweCI+5LiA562J5aWWPC9oMT4KICAgICAgICAgICAgPHNwYW4gc3R5bGU9Im1hcmdpbi1ib3R0b206IDEwcHg7Ij7kuI3otoXov4c1JTwvc3Bhbj4KICAgICAgICAgICAgPHNwYW4gc3R5bGU9ImZvbnQtd2VpZ2h0OiBib2xkIj7pmL/ph4zkupFDVEblpZblk4E8L3NwYW4+CiAgICAgICAgICAgIDxzcGFuIHN0eWxlPSJmb250LXdlaWdodDogYm9sZCI+TE9GUkVF5rSb5paQMSXmvKvpgI/mmI7mnLrmorDplK7nm5g8L3NwYW4+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBzdHlsZT0iCiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAgICAgICAgIj4KICAgICAgICAgICAgPGRpdiBzdHlsZT0iaGVpZ2h0OiA4OHB4OyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsiPgogICAgICAgICAgICAgICAgPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHJvbGU9InByZXNlbnRhdGlvbiIgc3R5bGU9IndpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7Ij4KICAgICAgICAgICAgICAgICAgICA8cGF0aAogICAgICAgICAgICAgICAgICAgICAgICBkPSJNMTIsNS4zMkwxOCw4LjY5VjE1LjMxTDEyLDE4LjY4TDYuMDYsMTUuMzRMMTIsMTJWNS4zMk0yMSwxNi41QzIxLDE2Ljg4IDIwLjc5LDE3LjIxIDIwLjQ3LDE3LjM4TDEyLjU3LDIxLjgyQzEyLjQxLDIxLjk0IDEyLjIxLDIyIDEyLDIyQzExLjc5LDIyIDExLjU5LDIxLjk0IDExLjQzLDIxLjgyTDMuNTMsMTcuMzhDMy4yMSwxNy4yMSAzLDE2Ljg4IDMsMTYuNVY3LjVDMyw3LjEyIDMuMjEsNi43OSAzLjUzLDYuNjJMMTEuNDMsMi4xOEMxMS41OSwyLjA2IDExLjc5LDIgMTIsMkMxMi4yMSwyIDEyLjQxLDIuMDYgMTIuNTcsMi4xOEwyMC40Nyw2LjYyQzIwLjc5LDYuNzkgMjEsNy4xMiAyMSw3LjVWMTYuNU0xMiw0LjE1TDUsOC4wOVYxNS45MUwxMiwxOS44NUwxOSwxNS45MVY4LjA5TDEyLDQuMTVaIgogICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT0iZmlsbDogcmdiKDIwMiwgMjAyLCAyMDIpIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L3N2Zz4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDxoMSBzdHlsZT0iZm9udC1zaXplOiAyNHB4Ij7kuoznrYnlpZY8L2gxPgogICAgICAgICAgICA8c3BhbiBzdHlsZT0ibWFyZ2luLWJvdHRvbTogMTBweDsiPuS4jei2hei/hzE1JTwvc3Bhbj4KICAgICAgICAgICAgPHNwYW4gc3R5bGU9ImZvbnQtd2VpZ2h0OiBib2xkIj5WWEXonLvonJPpvKDmoIcgPC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgc3R5bGU9IgogICAgICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwogICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgICAgICI+CiAgICAgICAgICAgIDxkaXYgc3R5bGU9ImhlaWdodDogODhweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7Ij4KICAgICAgICAgICAgICAgIDxzdmcgdmlld0JveD0iMCAwIDI0IDI0IiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyI+CiAgICAgICAgICAgICAgICAgICAgPHBhdGgKICAgICAgICAgICAgICAgICAgICAgICAgZD0iTTE4LDE1LjM4TDEyLDEyVjUuMzJMMTgsOC42OVYxNS4zOE0yMSwxNi41QzIxLDE2Ljg4IDIwLjc5LDE3LjIxIDIwLjQ3LDE3LjM4TDEyLjU3LDIxLjgyQzEyLjQxLDIxLjk0IDEyLjIxLDIyIDEyLDIyQzExLjc5LDIyIDExLjU5LDIxLjk0IDExLjQzLDIxLjgyTDMuNTMsMTcuMzhDMy4yMSwxNy4yMSAzLDE2Ljg4IDMsMTYuNVY3LjVDMyw3LjEyIDMuMjEsNi43OSAzLjUzLDYuNjJMMTEuNDMsMi4xOEMxMS41OSwyLjA2IDExLjc5LDIgMTIsMkMxMi4yMSwyIDEyLjQxLDIuMDYgMTIuNTcsMi4xOEwyMC40Nyw2LjYyQzIwLjc5LDYuNzkgMjEsNy4xMiAyMSw3LjVWMTYuNU0xMiw0LjE1TDUsOC4wOVYxNS45MUwxMiwxOS44NUwxOSwxNS45MVY4LjA5TDEyLDQuMTVaIgogICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT0iZmlsbDogcmdiKDE4NSwgNzcsIDUpIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L3N2Zz4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgIDxoMSBzdHlsZT0iZm9udC1zaXplOiAyNHB4Ij7kuInnrYnlpZY8L2gxPgogICAgICAgICAgICA8c3BhbiBzdHlsZT0ibWFyZ2luLWJvdHRvbTogMTBweDsiPuS4jei2hei/hzI1JTwvc3Bhbj4KICAgICAgICAgICAgPHNwYW4gc3R5bGU9ImZvbnQtd2VpZ2h0OiBib2xkIj7pl6rov6o2NEdV55uYPC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgc3R5bGU9IgogICAgICAgICAgICBkaXNwbGF5OiBmbGV4OwogICAgICAgICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwogICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgICAgICI+CiAgICAgICAgICAgIDxkaXYgc3R5bGU9ImhlaWdodDogODhweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7Ij4KICAgICAgICAgICAgICAgIDxzdmcgdmlld0JveD0iMCAwIDI0IDI0IiByb2xlPSJwcmVzZW50YXRpb24iIHN0eWxlPSJ3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyI+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0LjQsNkwxNCw0SDVWMjFIN1YxNEgxMi42TDEzLDE2SDIwVjZIMTQuNFoiCiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPSJmaWxsOiByZ2IoMTkyLCA2LCA2KTsgc3Ryb2tlOiByZ2IoMTc5LCAzLCAzKSI+PC9wYXRoPgogICAgICAgICAgICAgICAgPC9zdmc+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8aDEgc3R5bGU9ImZvbnQtc2l6ZTogMjRweDsgbWFyZ2luLWJvdHRvbTogMTVweCI+5oKs6LWP5aWW5YqxPC9oMT4KICAgICAgICAgICAgPHNwYW4gc3R5bGU9ImZvbnQtd2VpZ2h0OiBib2xkIj7pl6rov6o2NEdV55uYPC9zcGFuPgogICAgICAgIDwvZGl2PgogICAgPC9kaXY+CjwvZGl2PgoKIyMg5Y+C6LWb57uG5YiZCgoKKiAqKjEqKi4g5omA5pyJ5Y+C6LWb6YCJ5omL6ZyA6KaB5Zyo5q+U6LWb57uT5p2f5ZCOMTDliIbpkp/lhoXpgJrov4fpgq7nrrHkuIrkvKAgV3JpdGV1cDog5YyF5ZCr5omA5YGa5Ye66aKY55uu55qE5a6M5pW06Kej6aKY5q2l6aqkKCBXb3JkIOaIluiAhSBQREYg5qC85byPKeacquaMieaXtuaPkOS6pCB3cml0ZXVwIOinhuS4uuaUvuW8g+avlOi1m+aIkOe7qSwg6YKu566x5Zyw5Z2AOiBhMW5hdGFzQDEyNi5jb20gCiogKioyKiouIOS4uuS6hueFp+mhvuWkp+S4gOeahOaWsOWQjOWtpiwg5pys5qyh5q+U6LWb55qE5LiA562J5aWW5aWW5ZOB5Y+R5pS+57uZ5ruh6Laz5Lul5LiL5Lik5Liq5p2h5Lu255qE5ZCM5a2mOiAoMSkg5Zyo5q2k5qyh5q+U6LWb5Lit5oiQ5Yqf6I635b6X5LiA562J5aWWICgyKSDmiJDlip/liqDlhaXpm4borq3pmJ/miJbogIXmiJDlip/op6Plh7rmgqzotY/popjjgILojrflpZbogIXkuI3mu6HotrPmnaHku7YgKDIpIOWImeWlluWTgemhuuW7tiwg5L2G6I635aWW5LiN5Y+X5b2x5ZON44CCCgoqICoqMyoqLiDmr5TotZvlhYHorrjkvb/nlKjkupLogZTnvZHmkJzntKLlt6XlhbcsIOS9huemgeeUqCBRUSDlvq7kv6Eg562J5Lqk5rWB6YCa6K6v5bel5YW3LCDnpoHmraLmlLblj5Hku7vkvZXmlrnlvI/nmoTpgq7ku7blkoznn63kv6EsIOaJi+acuuS4gOW+i+WFs+acuiwg5ZCm5YiZ5Y+W5raI5q+U6LWb6LWE5qC844CCCgoKKiAqKjQqKi4g5q+U6LWb5YiG5Li65LqU5Liq5pa55ZCRLCDmr4/kuKrmlrnlkJHliIbml7bmrrXlj5HmlL7lhbHorqHkupTpgZPpopjnm64o5YyF5ZCr5LiA6YGT5oKs6LWP6aKYKSwg5q+P6YGT6aKY55uu5YiG5YC85LiN5ZCMLCDku6XliqjmgIHnp6/liIbnmoTlvaLlvI/orqHnrpfliIbmlbAsIOagueaNruacrOmimOino+mimOS6uuaVsOWKqOaAgemZjeS9juaJgOacieino+mimOiAheWcqOacrOmimOS4iueahOW+l+WIhiwg5bmz5Y+w5LyY5YWI5qC55o2u5Y+C6LWb6ICF5b6X5YiG6L+b6KGM5o6S5ZCNLCDliIbmlbDnm7jlkIzogIXmjInmnIDlkI4gZmxhZyDnmoTmj5DkuqTml7bpl7TmjpLlkI3jgIIKCgoqICoqNSoqLiDpg6jliIbpopjnm67otZvliY3kvJrmj5DliY3lvIDmlL7kuIvovb0sIOavlOi1m+aXtuaPkOS+m+WvueW6lOWOi+e8qeWMheeahOino+WOi+WvhueggeOAggoKCiogKio2KiouIOmimOebruiuvuS4gOS6jOS4ieihgOacuuWItiwg6aaW5L2N6Kej5Ye66ICF6I63IDUlIOeahOacrOmimOW+l+WIhuWKoOaIkCwg56ys5LqM5L2N6Kej5Ye66ICF6I63IDMlIOeahOacrOmimOW+l+WIhuWKoOaIkCwg56ys5LiJ5L2N6Kej5Ye66ICF6I63IDElIOeahOacrOmimOW+l+WIhuWKoOaIkOOAggoKCiogKio3KiouIOavlOi1m+aXtuS9v+eUqOeahOS4quS6uueUteiEkeeUseWPgui1m+mAieaJi+iHquihjOWHhuWkhywg5q+U6LWb5Lit5omA6ZyA6KaB55qE5bel5YW3562J6L2v5Lu2546v5aKD55Sx6YCJ5omL5Zyo6LWb5YmN5a6J6KOF5a6M5oiQLCDmr5TotZvml7bpl7TlhoXmib/lip7mlrnkuI3kvJrlkJHlj4LotZvpgInmiYvmj5Dkvpvku7vkvZXmnInlhbPotZvpopjjgIHnjq/looPnrYnmlrnpnaLnmoTluK7liqnjgIIKCiogKio4KiouIOWcqOernui1m+i/h+eoi+S4rSwg5Y+C6LWb6ICF5LiN5b6X5LiO5YW25LuW5Y+C6LWb6ICF5oiW56ue6LWb5oyH5a+85aeU5ZGY5Lya5oyH5a6a5bel5L2c5Lq65ZGY5Lul5aSW55qE5Lq65Lqk6LCILCDns7vnu5/mlK/mjIHkurrlkZjlj6/ku6Xlm57nrZTlkozns7vnu5/nm7jlhbPnmoTpl67popgsIOS+i+Wmguino+mHiuezu+e7n+mUmeivr+S/oeaBr+OAggoKKiAqKjkqKi4g5Y+C6LWb6ICF5pyJ5p2D5Yip5a+56aKY55uu5pys6Lqr5Lul5Y+KIGZsYWcg5YeG56Gu5oCn5o+Q5Ye655aR6ZeuLCDoo4HliKToi6Xnoa7orqTpopjnm67mnInor68sIOWwhuS8muWQkeaJgOacieWPgui1m+iAhei/m+ihjOWjsOaYjuW5tuabtOato+OAggoqICoqMTAqKi4g5q+U6LWb5pyA57uI6Kej6YeK5p2D5b2SIEExbmF0YXMg6ZuG6K6t6Zif5omA5pyJ44CCCgoKIyMg55Sz6K+35Yqg5YWlQ1RG6ZuG6K6t6ZifPGJyPgoK6LWb5ZCO56ym5ZCI5Lul5LiL5p2h5Lu25LmL5LiA55qE5ZCM5a2m5Y+v5ZCR6ZuG6K6t6Zif5o+Q5Lqk5YWl6Zif55Sz6K+3LCDnlLPor7fmj5DkuqTpgq7nrrHvvJphMW5hdGFzQDEyNi5jb20KCjEuIOatpOasoeaOkuWQjeWcqOWPgui1m+S6uuWRmOeahOWJjTQ1JeOAggoyLiDlr7nnvZHnu5zkuI7kv6Hmga/lronlhajmnInkuIDlrprkuobop6Plkozng63niLEsIOW5tuS4lOWvueiHquW3seaDs+aOoue0oueahOaWueWQkeacieaYjuehruinhOWIkuOAgg==")
description = description.decode("utf-8")

# 创建比赛
print("创建比赛")
res = session.post(
    url="http://localhost:7777/api/admin/game/create",
    json={
        "game_id": 0,
        "name": "测试比赛1",
        "summary": "",
        "description": description,
        "poster": "",
        "invite_code": "",
        "start_time": "2025-04-11T06:12:41.147Z",
        "end_time": "2025-06-11T06:12:41.147Z",
        "practice_mode": False,
        "team_number_limit": 3,
        "container_number_limit": 3,
        "require_wp": False,
        "wp_expire_time": "2025-04-11T06:12:41.147Z",
        "stages": [],
        "visible": True,
        "challenges": [],
    },
)

print(res.text)

print("添加题目")

for _ in range(1, 4):
    res = session.put(
        url=f"http://localhost:7777/api/admin/game/1/challenge/{_}",
    )

    print(f"题目{_}", res.text)
