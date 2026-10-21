package com._42students.lms.access;

/**
 * Thread-local holder for ScopeContext. Must be cleared in filter finally block.
 */
public final class ScopeContextHolder {
    private static final ThreadLocal<ScopeContext> HOLDER = new ThreadLocal<>();

    public static void set(ScopeContext context) {
        HOLDER.set(context);
    }

    public static ScopeContext get() {
        return HOLDER.get();
    }

    public static void clear() {
        HOLDER.remove();
    }

    private ScopeContextHolder() {}
}

