from redis import Redis
from rq import Queue

from app.config import settings


def get_queue(name: str = "default") -> Queue:
    return Queue(name, connection=Redis.from_url(settings.redis_url))


def enqueue_job(function_path: str, *args: object, **kwargs: object):
    queue = get_queue()
    return queue.enqueue(function_path, *args, **kwargs)

