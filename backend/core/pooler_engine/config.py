# pooler_engine/config.py

"""
Pooler configuration helper
Loads pool size, queue size, and timeout for a user database.
"""

DEFAULT_POOL_CONFIG = {
    "pool_size": 10,
    "queue_size": 20,
    "queue_timeout_ms": 5000,
}

def get_pool_config(user_db):
    """
    Returns pool configuration for a given user database.
    Falls back to defaults if no config exists.
    """
    try:
        config = user_db.pool_config
        return {
            "pool_size": config.pool_size,
            "queue_size": config.queue_size,
            "queue_timeout_ms": config.queue_timeout_ms,
        }
    except Exception:
        return DEFAULT_POOL_CONFIG
