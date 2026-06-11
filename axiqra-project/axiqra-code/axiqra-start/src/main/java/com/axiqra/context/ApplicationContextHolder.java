package com.axiqra.context;

import org.springframework.context.ApplicationContext;

/**
 * Spring ApplicationContext 持有者
 *
 * @author Axiqra Team
 * @date 2026-06-11
 */
public class ApplicationContextHolder {

    private static volatile ApplicationContext context;

    public static void setApplicationContext(ApplicationContext ctx) {
        context = ctx;
    }

    public static <T> T getBean(Class<T> clazz) {
        if (context == null) {
            throw new IllegalStateException("ApplicationContext 未初始化，请确认 AxiqraApplication 已启动");
        }
        return context.getBean(clazz);
    }

    public static <T> T getBean(String name, Class<T> clazz) {
        if (context == null) {
            throw new IllegalStateException("ApplicationContext 未初始化，请确认 AxiqraApplication 已启动");
        }
        return context.getBean(name, clazz);
    }
}
