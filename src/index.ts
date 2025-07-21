import type { API } from "homebridge";

import { HisensePlatform } from "./homebridge/HisensePlatform.js";
import { PLATFORM_NAME } from "./homebridge/settings.js";

/**
 * This method registers the platform with Homebridge
 */
export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HisensePlatform);
};
