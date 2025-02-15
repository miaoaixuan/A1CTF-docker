#!/bin/sh

commit_short_hash=$(git rev-parse --short dev)

A1CTF_BRANCH=dev
A1CTF_VERSION=$commit_short_hash
A1CTF_NAME="A1CTF Preview"

echo "export const A1CTF_VERSION = \"$A1CTF_BRANCH-$A1CTF_VERSION\"" > version.ts
echo "export const A1CTF_NAME = \"$A1CTF_NAME\"" >> version.ts

docker build . -t a1ctf-$commit_short_hash
docker save a1ctf-$commit_short_hash > docker_images/a1ctf-$commit_short_hash.tar
docker image rm a1ctf-$commit_short_hash