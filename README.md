# Uheer
## Introduction
Uheer.me `REST API` service and Angular.js application.

## Setup
### For development
1. Update all dependencies with NuGet:
```
Right click on Solution > Manage all NuGet Packages for Solution... > Updates > Update
```

2. Migrate the database:
```
Ctrl+Q > type "Package Manager Console" > Update-Database -ProjectName Uheer.Data -Force
```

### For production
```
Right click on Uheer project > Publish > Select "Relase" configuration > Publish
```
