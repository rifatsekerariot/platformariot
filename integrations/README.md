## Beaver IoT Integrations
Integrations are the primary means for Beaver IoT to interact with third-party services, devices, platforms, etc., enabling device connectivity, device control, and feature expansion.

## Start building your integrations

The following is the directory structure of this project.

```
  beaver-iot-integrations/
  ├── integrations/                             # integration directory
  │ ├── sample-integrations/                    # Sample integration directory
  │ │   └── ...                                 # Sample integrations
  │ ├── msc-integration                         # Milesight Developer Platform integration
  │ └──...                                      # Other integrations
```

If you want to develop your own integration, please create a new integration package under the `beaver-iot-integrations/integrations/` directory. For more information, please refer to [Quick Start](https://www.milesight.com/beaver-iot/docs/dev-guides/backend/build-integration) of Integration Development.

## ChirpStack v4 HTTP Integration

The **chirpstack-integration** module receives LoRaWAN uplinks and events from ChirpStack v4 via HTTP webhook (no token/password). It runs with Beaver IoT Docker.

- **Bağlantı ve çalıştırma (ChirpStack’e nasıl bağlanır, nasıl ayağa kaldırılır):** [CHIRPSTACK_BAGLANTI_VE_CALISTIRMA.md](CHIRPSTACK_BAGLANTI_VE_CALISTIRMA.md)  
- **Zero touch (Linux sunucuda tek komutla ayağa kaldırma):** [beaver-iot-docker / ZERO_TOUCH_DEPLOY.md](https://github.com/rifatsekerariot/beaver-iot-docker/blob/main/ZERO_TOUCH_DEPLOY.md)  
- **Runbook:** [RUNBOOK_CHIRPSTACK_DOCKER.md](RUNBOOK_CHIRPSTACK_DOCKER.md)  
- **Test plan:** [TEST_PLAN_CHIRPSTACK.md](TEST_PLAN_CHIRPSTACK.md)  
- **Plan (Docker + repos):** [PLAN_BEAVER_DOCKER_CHIRPSTACK_V4.md](PLAN_BEAVER_DOCKER_CHIRPSTACK_V4.md)
