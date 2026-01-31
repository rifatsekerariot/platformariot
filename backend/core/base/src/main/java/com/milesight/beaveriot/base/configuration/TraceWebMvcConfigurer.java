package com.milesight.beaveriot.base.configuration;

import com.milesight.beaveriot.base.tracer.TraceIdInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Trace interceptor registration. Does NOT use @EnableWebMvc — that would disable
 * Spring Boot's web auto-configuration and cause API paths (e.g. /alarms/rules) to
 * be mishandled as static resources (500 "No static resource").
 *
 * @author leon
 */
@Configuration
public class TraceWebMvcConfigurer implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new TraceIdInterceptor()).addPathPatterns("/**");
    }
}