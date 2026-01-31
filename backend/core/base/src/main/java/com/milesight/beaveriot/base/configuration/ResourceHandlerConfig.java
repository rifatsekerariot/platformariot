package com.milesight.beaveriot.base.configuration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Ensures resource handler only matches /static/** — prevents API paths like /alarms/search
 * from being mishandled as static resources (500 "No static resource").
 * Spring Boot's add-mappings/static-path-pattern may not take effect in all environments.
 */
@Configuration
@ConditionalOnWebApplication
public class ResourceHandlerConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public WebMvcConfigurer resourceHandlerConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // Only add /static/** — no /** handler. API paths (/alarms/*, /api/v1/*) go to controllers.
                if (!registry.hasMappingForPattern("/static/**")) {
                    registry.addResourceHandler("/static/**")
                            .addResourceLocations("classpath:/static/");
                }
            }
        };
    }
}
