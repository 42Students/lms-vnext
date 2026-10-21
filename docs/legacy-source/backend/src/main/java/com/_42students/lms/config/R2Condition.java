package com._42students.lms.config;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Custom condition to check if R2 account ID is configured and non-empty.
 * This is more reliable than @ConditionalOnExpression for checking non-empty strings.
 */
public class R2Condition implements Condition {
    
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String accountId = context.getEnvironment().getProperty("r2.account.id");
        return StringUtils.hasText(accountId);
    }
}


