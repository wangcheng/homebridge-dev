import type {
  CharacteristicValue,
  Logging,
  PlatformAccessory,
  Service,
} from "homebridge";

import type { HisenseApiClient } from "../hisense/HisenseApiClient.js";
import type { HisenseDevice } from "../hisense/types.js";
import type { HisensePlatform } from "./HisensePlatform.js";

import { HisenseAC } from "../hisense/ac/HisenseAC.js";
import { MANUFACTURER_NAME } from "./settings.js";

export type AccessoryWithContext = PlatformAccessory<{ device: HisenseDevice }>;

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HisenseACAccessory {
  private deviceInstance: HisenseAC;
  private heaterCoolerService: Service;

  constructor(
    private readonly platform: HisensePlatform,
    private readonly accessory: AccessoryWithContext,
    apiClient: HisenseApiClient,
    log: Logging
  ) {
    const { device: deviceProps } = accessory.context;
    this.deviceInstance = new HisenseAC(apiClient, deviceProps, log);

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      ?.setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        MANUFACTURER_NAME
      )
      .setCharacteristic(this.platform.Characteristic.Model, "Default-Model")
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        deviceProps.barCode
      );

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory

    this.heaterCoolerService =
      this.accessory.getService(this.platform.Service.HeaterCooler) ??
      this.accessory.addService(this.platform.Service.HeaterCooler);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.heaterCoolerService.setCharacteristic(
      this.platform.Characteristic.Name,
      deviceProps.deviceNickName
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.heaterCoolerService
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.
   * In this case, you may decide not to implement `onGet` handlers, which may speed up
   * the responsiveness of your device in the Home app.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.deviceInstance.getStatus().power_on;

    this.platform.log.debug("Get Characteristic On ->", isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    if (isOn === undefined) {
      throw new this.platform.api.hap.HapStatusError(
        this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE
      );
    }

    return isOn;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    await this.deviceInstance.turnOnOrOff(value as boolean);

    this.platform.log.debug("Set Characteristic On ->", value);
  }
}
