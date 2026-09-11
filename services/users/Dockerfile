# users (.NET 10 + EF Core) — auth/JWT, escucha en :5001.
# Multi-stage: SDK para compilar, runtime ASP.NET para correr.

# Etapa build: restaura y publica en Release.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Solo el csproj primero → aprovecha la caché si no cambian dependencias.
COPY *.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /app

# Etapa runtime: imagen liviana sin SDK.
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app ./
EXPOSE 5001
# Kestrel debe oír en 5001 (el gateway enruta a users:5001).
ENV ASPNETCORE_URLS=http://+:5001
# Ajusta el nombre del dll al de tu proyecto.
ENTRYPOINT ["dotnet", "Users.dll"]
