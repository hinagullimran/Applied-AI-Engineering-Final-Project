import logging
import json
import time
import uuid
from pythonjsonlogger import jsonlogger
from fastapi import Request

class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        if not hasattr(record, 'correlation_id'):
            record.correlation_id = "N/A"
        return True

def setup_logging():
    logger = logging.getLogger("catalyst")
    logger.setLevel(logging.INFO)
    
    logHandler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s %(correlation_id)s',
        rename_fields={'levelname': 'level', 'asctime': 'timestamp'}
    )
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)
    logger.addFilter(CorrelationIdFilter())
    return logger

logger = setup_logging()
