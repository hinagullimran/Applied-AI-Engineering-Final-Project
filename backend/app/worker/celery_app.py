import os
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "catalyst_worker",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

celery_app.conf.task_routes = {
    "app.worker.tasks.*": {"queue": "catalyst_tasks"}
}

@celery_app.task(name="ping")
def ping_task():
    return "pong"
