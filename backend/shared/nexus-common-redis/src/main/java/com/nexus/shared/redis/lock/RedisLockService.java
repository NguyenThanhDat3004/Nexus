package com.nexus.shared.redis.lock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

/**
 * Shared Enterprise Distributed Lock & Cooldown Component.
 * Can be reused across any Nexus backend domain service (identify_access, workspace, notification, etc.).
 */
@Component
public class RedisLockService {

    private static final Logger log = LoggerFactory.getLogger(RedisLockService.class);
    private static final String LOCK_PREFIX = "nexus:lock:";

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    /**
     * Tries to acquire an atomic distributed lock for a specific key using Redis SETNX.
     *
     * @param lockKey  Unique business key (e.g. "register:user@email.com")
     * @param timeout  Lock validity / cooldown duration
     * @return true if lock acquired successfully, false if already locked by another process
     */
    public boolean tryAcquire(String lockKey, Duration timeout) {
        if (redisTemplate == null) {
            log.warn("Redis is unavailable. Distributed lock bypassed for key: {}", lockKey);
            return true;
        }

        try {
            String fullKey = LOCK_PREFIX + lockKey;
            Boolean acquired = redisTemplate.opsForValue().setIfAbsent(fullKey, "LOCKED", timeout);
            boolean isLocked = Boolean.TRUE.equals(acquired);
            if (isLocked) {
                log.debug("Acquired distributed lock for key: {} (TTL: {}s)", fullKey, timeout.toSeconds());
            } else {
                log.warn("Failed to acquire lock for key: {}. Another request is currently executing.", fullKey);
            }
            return isLocked;
        } catch (Exception ex) {
            log.warn("Redis lock error ({}) for key: {}. Fallback allow execution.", ex.getMessage(), lockKey);
            return true;
        }
    }

    /**
     * Enforces a mandatory cooldown period between consecutive requests.
     * Throws HTTP 429 (TOO_MANY_REQUESTS) if request arrives within the cooldown window.
     *
     * @param actionKey Business action key
     * @param cooldown  Cooldown duration (e.g. 5 seconds)
     */
    public void acquireCooldownOrThrow(String actionKey, Duration cooldown) {
        if (!tryAcquire(actionKey, cooldown)) {
            Long remainingTtl = getRemainingTtl(actionKey);
            String waitSeconds = remainingTtl != null && remainingTtl > 0 ? String.valueOf(remainingTtl) : "a few";
            log.warn("Rate limit / Cooldown hit for key: {}. Must wait {}s", actionKey, waitSeconds);
            throw new ResponseStatusException(
                    HttpStatusCode.valueOf(429),
                    "Request is being processed. Please wait " + waitSeconds + " seconds before trying again."
            );
        }
    }

    /**
     * Manually releases the lock before TTL expires.
     */
    public void releaseLock(String lockKey) {
        if (redisTemplate == null) return;

        try {
            String fullKey = LOCK_PREFIX + lockKey;
            redisTemplate.delete(fullKey);
            log.debug("Released distributed lock for key: {}", fullKey);
        } catch (Exception ex) {
            log.warn("Failed to release Redis lock for key: {} ({})", lockKey, ex.getMessage());
        }
    }

    /**
     * Get remaining time in seconds for the active lock.
     */
    public Long getRemainingTtl(String lockKey) {
        if (redisTemplate == null) return null;
        try {
            String fullKey = LOCK_PREFIX + lockKey;
            return redisTemplate.getExpire(fullKey);
        } catch (Exception ex) {
            return null;
        }
    }
}
