import type { DeviceExtInfo } from "./ext-types.js";

export interface TokenInfo {
  customerId: string;
  loginname: string;
  refreshToken: string;
  refreshTokenExpiredTime: string;
  resultCode: string;
  signatureServer: string;
  subscriberId: string;
  token: string;
  tokenCreateTime: string;
  tokenExpiredTime: string;
}

export interface Home {
  address: string;
  city: string;
  desc: string;
  district: string;
  homeId: number;
  homeName: string;
  isUserSetted: string;
  jhkHomeId: number;
  province: string;
  roleFlag: number;
  roomCode: unknown;
}

export interface Device {
  deviceId: string;
  wifiId: string;
}

export interface HisenseDevice {
  barCode: string;
  bindTime: string;
  deviceCode: string;
  deviceId: string;
  deviceName: string;
  deviceNickName: string;
  deviceSubTypeCode: string;
  deviceTypeCode: string;
  deviceTypeName: string;
  extInfo: DeviceExtInfo;
  index: number;
  mutiDevice: number;
  orderId: number;
  roomId: number;
  roomName: string;
  splitStatus: number;
  status: number;
  supportSplit: number;
  useDeviceSubTypeCode: null | string;
  wifiId: string;
  wifiModuleType: number;
}
