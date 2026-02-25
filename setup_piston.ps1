# Setup Piston Languages for CodeQuest
# Run this after docker-compose up -d

Write-Host "Installing Python, Java, and C++ in Piston container..." -ForegroundColor Cyan

docker exec -it codequest-piston piston pkg install python=3.10.0
docker exec -it codequest-piston piston pkg install openjdk=17.0.2
docker exec -it codequest-piston piston pkg install gcc=10.2.0

Write-Host "Piston setup complete!" -ForegroundColor Green
