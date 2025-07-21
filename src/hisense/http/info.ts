import ky from "ky";

import type { HisenseDevice, Home } from "../types.js";
import type { ServerResB } from "./base-types.js";

import { HisenseApiError } from "./HisenseApiError.js";

const URL_HOME_INFO = "https://api-wg.hismarttv.com/wg/dm";
const PATH_GET_HOME_LIST = "getHomeList";
const PATH_GET_HOME_DEVICE_LIST = "getHomeDeviceList";

type GetHomeListResponse = ServerResB<{
  homeList: Home[];
}>;

export const getHomeList = async (accessToken: string) => {
  const response = await ky
    .get<GetHomeListResponse>(PATH_GET_HOME_LIST, {
      prefixUrl: URL_HOME_INFO,
      searchParams: { accessToken },
    })
    .json();

  if (response.response?.resultCode !== 0) {
    throw new HisenseApiError("getHomeList", response);
  } else {
    return response.response.homeList;
  }
};

type GetHomeDeviceListResponse = ServerResB<{
  deviceList: HisenseDevice[];
}>;

export const getHomeDeviceList = async (
  accessToken: string,
  homeId: number
) => {
  const response = await ky
    .get<GetHomeDeviceListResponse>(PATH_GET_HOME_DEVICE_LIST, {
      prefixUrl: URL_HOME_INFO,
      searchParams: { accessToken, homeId },
    })
    .json();

  if (response.response?.resultCode !== 0) {
    throw new HisenseApiError("getHomeDeviceList", response);
  } else {
    return response.response.deviceList;
  }
};
