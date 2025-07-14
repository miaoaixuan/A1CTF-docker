FROM node:22-alpine AS frontend-builder

WORKDIR /app/clientapp

COPY clientapp/package*.json ./
RUN npm ci --only=production

COPY clientapp/ ./
RUN npm install
RUN npm run build

FROM golang:1.24-alpine AS backend-builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./

ENV GOPROXY=https://goproxy.cn,direct
RUN go mod download

COPY src/ ./src/

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o app src/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/data && \
    chown -R appuser:appgroup /app

COPY --from=frontend-builder /app/clientapp ./clientapp
COPY --from=backend-builder /app/app ./
COPY migrations/ ./migrations/

RUN chown -R appuser:appgroup /app && \
    chmod +x /app/app

USER appuser

EXPOSE 7777

CMD ["./app"]
