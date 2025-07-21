import ky from "ky";

import type { Device } from "../types.js";
import type { ServerResB } from "./base-types.js";

import { HisenseApiError } from "./HisenseApiError.js";

const URL_CMD = "https://api-wg.hismarttv.com/agw/dsg/outer";
const PATH_POWER_CMD = "sendDeviceModelCmd";
const PATH_LOGIC_CMD = "uploadRemoteLogicCmd";
const PATH_STATUS_CHECK = "getDeviceLogicalStatusArray";

interface PowerCommandData {
  attributes: string;
  cmdVersion: string;
  deviceId: string;
  extendParam: string;
  wifiId: string;
}

async function sendCommand<Req, Res>(
  endpoint: string,
  commandData: Req,
  accessToken: string
) {
  return await ky
    .post<Res>(endpoint, {
      json: commandData,
      prefixUrl: URL_CMD,
      searchParams: { accessToken },
    })
    .json();
}

type PowerCommandRes = ServerResB<{
  desc: string;
  errorCode: number;
  errorDesc: null | string;
  preStatus: string;
}>;

export async function sendPowerCommand(
  accessToken: string,
  { deviceId, wifiId }: Device,
  onAndOff: "Off" | "On"
) {
  const response = await sendCommand<PowerCommandData, PowerCommandRes>(
    PATH_POWER_CMD,
    {
      attributes: JSON.stringify({ onAndOff }),
      cmdVersion: "0",
      deviceId,
      extendParam: "1",
      wifiId,
    },
    accessToken
  );
  if (response.response?.resultCode !== 0) {
    throw new HisenseApiError("sendPowerCommand", response);
  }
  return response.response.preStatus;
}

interface Command<P = unknown> {
  cmdId: number;
  cmdOrder: number;
  cmdParm: P;
  delayTime: number;
}

interface LogicCommandData {
  cmdList: Command[];
  cmdVersion: string;
  deviceId: string;
  extendParm: string;
  wifiId: string;
}

type LogicCommandRes = ServerResB<{
  desc: string;
  preStatus: string;
}>;

export async function sendLogicCommand<P>(
  accessToken: string,
  { deviceId, wifiId }: Device,
  command: Command<P>
) {
  const response = await sendCommand<LogicCommandData, LogicCommandRes>(
    PATH_LOGIC_CMD,
    {
      cmdList: [command],
      cmdVersion: "1684085201",
      deviceId,
      extendParm: "1",
      wifiId,
    },
    accessToken
  );
  if (response.response?.resultCode !== 0) {
    throw new HisenseApiError("sendLogicCommand", response);
  }
  return response.response.preStatus;
}

interface CheckStatusCommand {
  deviceList: Device[];
}

export interface DeviceStatus {
  cmdVersion: number;
  deviceId: string;
  deviceStatus: string; // number list joined by ","
  statusVersion: number;
  wifiId: string;
}

type CheckStatusRes = ServerResB<{
  deviceStatusList: DeviceStatus[];
}>;

export async function sendCheckStatusCommand(
  accessToken: string,
  devices: Device[]
) {
  const response = await sendCommand<CheckStatusCommand, CheckStatusRes>(
    PATH_STATUS_CHECK,
    { deviceList: devices },
    accessToken
  );
  if (response.response?.resultCode !== 0) {
    throw new HisenseApiError("sendCheckStatusCommand", response);
  } else {
    return response.response.deviceStatusList;
  }
}
