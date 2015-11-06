# Setup

## Development
1. Update all dependencies with NuGet:
```
Right click on Solution > Manage all NuGet Packages for Solution... > Updates > Update
```

2. Migrate the database:
```
Ctrl+Q > type "Package Manager Console" > Update-Database -ProjectName Uheer.Data -Force
```

## Production

Amazon credentials and ssh keys are required.*

```
Right click on Uheer project > Publish > Select "Relase" configuration > Publish
```
