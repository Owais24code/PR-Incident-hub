# Worker

The production worker runs the same Python package as the API and starts with:

```powershell
python -m app.worker_main
```

Docker Compose builds one backend image from `services/api` and runs it with a worker command for consistency.

