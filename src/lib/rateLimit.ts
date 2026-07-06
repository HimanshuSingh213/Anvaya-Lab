interface RateLimitTracker {
    count: number;
    resetTime: number;
}

const cache = new Map<string, RateLimitTracker>();

export function rateLimit(
    ip: string,
    limit: number,
    durationMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
    
    const now = Date.now();
    let tracker = cache.get(ip);

    if (!tracker) {
        tracker = { count: 1, resetTime: now + durationMs };
        cache.set(ip, tracker);
        return { success: true, limit, remaining: limit - 1, reset: tracker.resetTime };
    }

    if (now > tracker.resetTime) {
        tracker.count = 1;
        tracker.resetTime = now + durationMs;
        return { success: true, limit, remaining: limit - 1, reset: tracker.resetTime };
    }

    if (tracker.count >= limit) {
        return { success: false, limit, remaining: 0, reset: tracker.resetTime };
    }

    tracker.count += 1;
    return { success: true, limit, remaining: limit - tracker.count, reset: tracker.resetTime };
}
