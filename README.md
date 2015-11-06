# Uheer
## Introduction
uheer.me back-end **REST** service and the web application.

This project started in March 11th, 2015.
In November 6th, 2015, it was moved to GitHub so its source-code could be available in the MIT license.

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

Amazon credentials and ssh keys are required.*

```
Right click on Uheer project > Publish > Select "Relase" configuration > Publish
```
