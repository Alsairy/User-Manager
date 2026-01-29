#!/bin/bash
export ConnectionStrings__Default="Server=localhost,1434;Database=UserManager;User Id=sa;Password=LocalDev!Passw0rd123;TrustServerCertificate=true;Encrypt=True;MultipleActiveResultSets=true"
export ConnectionStrings__Elsa="Server=localhost,1434;Database=UserManager_Elsa;User Id=sa;Password=LocalDev!Passw0rd123;TrustServerCertificate=true;Encrypt=True;MultipleActiveResultSets=true"
export ConnectionStrings__Redis="localhost:6379"
export Jwt__SigningKey="LocalDevSigningKey_SuperSecret_1234567890!"
export Seed__Enabled=true
export Seed__AdminEmail="admin@madares.sa"
export Seed__AdminPassword="Admin123!"
export ASPNETCORE_URLS="http://localhost:5050"

cd "$(dirname "$0")/src/Api"
dotnet run
