import os

def list_files(directory):
    files = []
    for entry in os.listdir(directory):
        path = os.path.join(directory, entry)
        if os.path.isfile(path):
            files.append(path)
        elif os.path.isdir(path) and "node_modules" not in path and ".next" not in path and ".git" not in path:
            files.extend(list_files(path))
    return files

lines = 0
for file in list_files("."):
    file: str
    if file.endswith(".tsx") or file.endswith(".ts") and not "GZApi.ts" in file:
        with open(file, "r", encoding="utf-8") as f:
            lines += f.read().count("\n")
            f.close()

print(f"Total: {lines} lines.")