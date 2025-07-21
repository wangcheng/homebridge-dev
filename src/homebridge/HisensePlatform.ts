import {
  type API,
  Categories,
  type Characteristic,
  type DynamicPlatformPlugin,
  type Logging,
  type PlatformAccessory,
  type PlatformConfig,
  type Service,
} from "homebridge";

import type { AccessoryWithContext } from "./HisenseACAccessory.js";

import { HisenseApiClient } from "../hisense/HisenseApiClient.js";
import { HisenseACAccessory } from "./HisenseACAccessory.js";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings.js";

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HisensePlatform implements DynamicPlatformPlugin {
  // this is used to track restored cached accessories
  public readonly accessories = new Map<string, PlatformAccessory>();
  public readonly Characteristic: typeof Characteristic;

  public readonly discoveredCacheUUIDs: string[] = [];
  public readonly Service: typeof Service;

  private apiClient: HisenseApiClient;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig & {
      password: string;
      username: string;
    },
    public readonly api: API
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug("Finished initializing platform:", this.config.name);

    this.apiClient = new HisenseApiClient(
      this.config.username,
      this.config.password,
      this.log
    );

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.api.on("didFinishLaunching", async () => {
      log.debug("Executed didFinishLaunching callback");
      await this.apiClient.login();
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info("Loading accessory from cache:", accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.set(accessory.UUID, accessory);

    if (accessory.context.deviceProps) {
      new HisenseACAccessory(
        this,
        accessory as AccessoryWithContext,
        this.apiClient,
        this.log
      );
    }
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const homes = await this.apiClient.listHomes();
    if (homes.length === 0) return;
    const devices = await this.apiClient.listDevices(homes[0].homeId);

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of devices) {
      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.wifiId + device.deviceId);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.get(uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info(
          "Restoring existing accessory from cache:",
          existingAccessory.displayName
        );

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. e.g.:
        existingAccessory.context.device = device;
        this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new HisenseACAccessory(
          this,
          existingAccessory as AccessoryWithContext,
          this.apiClient,
          this.log
        );

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, e.g.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info("Adding new accessory:", device.deviceNickName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(
          device.deviceNickName,
          uuid,
          Categories.AIR_CONDITIONER
        );

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new HisenseACAccessory(
          this,
          accessory as AccessoryWithContext,
          this.apiClient,
          this.log
        );

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }

      // push into discoveredCacheUUIDs
      this.discoveredCacheUUIDs.push(uuid);
    }

    // you can also deal with accessories from the cache which are no longer present by removing them from Homebridge
    // for example, if your plugin logs into a cloud account to retrieve a device list, and a user has previously removed a device
    // from this cloud account, then this device will no longer be present in the device list but will still be in the Homebridge cache
    for (const [uuid, accessory] of this.accessories) {
      if (!this.discoveredCacheUUIDs.includes(uuid)) {
        this.log.info(
          "Removing existing accessory from cache:",
          accessory.displayName
        );
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
    }
  }
}
