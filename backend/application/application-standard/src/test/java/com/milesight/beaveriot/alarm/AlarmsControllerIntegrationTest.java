package com.milesight.beaveriot.alarm;

import com.milesight.beaveriot.alarm.controller.AlarmsController;
import com.milesight.beaveriot.alarm.service.AlarmRuleService;
import com.milesight.beaveriot.alarm.service.AlarmService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Verifies AlarmsController endpoints are mapped and reachable.
 * 404/500 = routing/config issue. 200/401/403 = endpoint exists.
 */
@WebMvcTest(controllers = AlarmsController.class)
@AutoConfigureMockMvc(addFilters = false)
class AlarmsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AlarmService alarmService;

    @MockBean
    private AlarmRuleService alarmRuleService;

    @Test
    void alarmsSearch_shouldNotReturn404Or500() throws Exception {
        mockMvc.perform(post("/alarms/search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    if (s == 404 || s == 500) throw new AssertionError("Got " + s + " - endpoint not reachable");
                });
    }

    @Test
    void alarmsRules_shouldNotReturn404Or500() throws Exception {
        mockMvc.perform(get("/alarms/rules"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    if (s == 404 || s == 500) throw new AssertionError("Got " + s + " - endpoint not reachable");
                });
    }

    @Test
    void alarmsRules_withApiV1Prefix_shouldNotReturn404Or500() throws Exception {
        mockMvc.perform(get("/api/v1/alarms/rules"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    if (s == 404 || s == 500) throw new AssertionError("Got " + s + " - endpoint not reachable");
                });
    }
}
