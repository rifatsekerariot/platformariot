package com.milesight.beaveriot.debug;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Teşhis amaçlı minimal endpoint. /__ping "No static resource" veriyorsa DispatcherServlet
 * veya routing katmanında sorun var.
 * Kapatmak için: debug.ping.enabled=false
 */
@RestController
@ConditionalOnProperty(name = "debug.ping.enabled", havingValue = "true", matchIfMissing = false)
public class DebugController {

    @GetMapping("/__ping")
    public String ping() {
        return "ok";
    }
}
