import type { HisenseApiClient } from "../HisenseApiClient.js";
import type { Logger } from "../logger.js";
import type { Device } from "../types.js";
import type { FanMode, HVACMode } from "./enums.js";

interface Status {
  aux_heat?: boolean;
  desired_temperature?: number;
  fan_mode_id?: FanMode;
  hvac_mode_id?: HVACMode;
  indoor_temperature?: number;
  nature_wind?: boolean;
  power_on?: boolean;
  screen_on?: boolean;
  swing_mode_id?: number;
}

export class HisenseAC {
  private apiClient: HisenseApiClient;

  private device: Device;
  private logger: Logger;
  private status: Status;

  constructor(apiClient: HisenseApiClient, device: Device, logger: Logger) {
    this.device = device;
    this.apiClient = apiClient;
    this.logger = logger;

    this.status = {
      power_on: false,
    };
  }

  async checkStatus() {
    const deviceStatusList = await this.apiClient.sendCheckStatusCommand([
      this.device,
    ]);
    if (deviceStatusList[0]) {
      try {
        const resultList = deviceStatusList[0].deviceStatus
          .split(",")
          .map((i) => parseInt(i, 10));
        this.updateStatus(resultList);
      } catch {
        this.logger.warn("Failed to parse deviceStatus.", this.device);
        return;
      }
    } else {
      this.logger.warn("deviceStatusList is empty", this.device);
    }
  }

  getStatus() {
    return this.status;
  }

  async setAuxHeatMode(mode: 0 | 1) {
    await this.apiClient.sendLogicCommand(this.device, 28, mode);
  }

  async setFanMode(mode: number) {
    await this.apiClient.sendLogicCommand(this.device, 1, mode);
  }

  async setHvacMode(mode: number) {
    await this.apiClient.sendLogicCommand(this.device, 3, mode);
  }

  async setPanelDisplayMode(mode: 0 | 1) {
    await this.apiClient.sendLogicCommand(this.device, 41, mode);
  }

  async setPreventDirectWindMode(mode: 0 | 1) {
    await this.apiClient.sendLogicCommand(this.device, 58, mode);
  }

  async setSwingMode(mode: number) {
    await this.apiClient.sendLogicCommand(this.device, 62, mode);
  }

  async setTemperature(temperatureInCelsius: number) {
    await this.apiClient.sendLogicCommand(this.device, 6, temperatureInCelsius);
  }

  async turnOnOrOff(value: boolean) {
    this.status.power_on = value;
    await this.apiClient.sendPowerCommand(this.device, value ? "On" : "Off");
  }

  private updateStatus(resultList: number[]) {
    this.status.desired_temperature = resultList[9];
    this.status.indoor_temperature = resultList[10];
    this.status.hvac_mode_id = resultList[4] as HVACMode;
    this.status.fan_mode_id = resultList[0] as FanMode;
    this.status.screen_on = resultList[58] === 1;
    this.status.power_on = resultList[5] === 1;
    this.status.aux_heat = resultList[45] === 1;
    this.status.nature_wind = resultList[44] === 1;
    this.status.swing_mode_id = resultList[209];
  }
}
