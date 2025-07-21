import type { Logger } from "./logger.js";
import type { Device, TokenInfo } from "./types.js";

import { requestLogin, requestRefreshToken } from "./http/auth.js";
import {
  sendCheckStatusCommand,
  sendLogicCommand,
  sendPowerCommand,
} from "./http/command.js";
import { getHomeDeviceList, getHomeList } from "./http/info.js";

interface LoginInfo {
  accessToken: string;
  customerId: string;
  loginName: string;
  refreshToken: string;
  // age in seconds
  refreshTokenExpiredTime: number;
  // unix timestamp in seconds
  tokenCreateTime: number;
  // age in seconds
  tokenExpiredTime: number;
}

// expire the token if age is less than 10 seconds
const TOKEN_EXPIRE_THRESHOLD = 10;

export class HisenseApiClient {
  private logger: Logger;

  private loginInfo: LoginInfo | null = null;
  private password: string;
  private username: string;

  constructor(username: string, password: string, logger: Logger) {
    if (!username) {
      throw new Error("username is empty!");
    }
    if (!password) {
      throw new Error("password is empty!");
    }
    this.username = username;
    this.password = password;
    this.logger = logger;
  }

  async listDevices(homeId: number) {
    this.logger.debug("[HisenseApiClient] listDevices");
    const accessToken = await this.ensureAccessToken();
    const result = await getHomeDeviceList(accessToken, homeId);
    this.logger.debug(
      "[HisenseApiClient] listDevices success",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      result.map(({ extInfo, ...info }) => info)
    );
    return result;
  }

  async listHomes() {
    this.logger.debug("[HisenseApiClient] listHomes");
    const accessToken = await this.ensureAccessToken();
    const result = await getHomeList(accessToken);
    this.logger.debug(
      "[HisenseApiClient] listHomes success",
      result.map((home) => home.homeName)
    );
    return result;
  }

  async login() {
    this.logger.debug("[HisenseApiClient] login");
    const tokenInfo = await requestLogin({
      loginName: this.username,
      signature: this.password,
    });
    this.logger.debug("[HisenseApiClient] login success", tokenInfo);
    return this.updateLoginInfo(tokenInfo);
  }

  async refreshToken(refreshToken: string) {
    this.logger.debug("[HisenseApiClient] refreshToken");
    const tokenInfo = await requestRefreshToken(refreshToken);
    this.logger.debug("[HisenseApiClient] refreshToken success", tokenInfo);
    return this.updateLoginInfo(tokenInfo);
  }

  async sendCheckStatusCommand(devices: Device[]) {
    this.logger.debug("[HisenseApiClient] sendCheckStatusCommand");
    const accessToken = await this.ensureAccessToken();
    const result = await sendCheckStatusCommand(accessToken, devices);
    this.logger.debug(
      "[HisenseApiClient] sendCheckStatusCommand success",
      result
    );
    return result;
  }

  async sendLogicCommand<P>(device: Device, id: number, param: P) {
    this.logger.debug("[HisenseApiClient] sendLogicCommand", { id, param });
    const accessToken = await this.ensureAccessToken();
    const result = await sendLogicCommand(accessToken, device, {
      cmdId: id,
      cmdOrder: 0,
      cmdParm: param,
      delayTime: 0,
    });
    this.logger.debug(
      "[HisenseApiClient] sendCheckStatusCommand success",
      result
    );
  }

  async sendPowerCommand(device: Device, onAndOff: "Off" | "On") {
    this.logger.debug("[HisenseApiClient] sendLogicCommand", { onAndOff });
    const accessToken = await this.ensureAccessToken();
    const result = await sendPowerCommand(accessToken, device, onAndOff);
    this.logger.debug("[HisenseApiClient] sendLogicCommand success", result);
  }

  private async ensureAccessToken() {
    if (!this.loginInfo) {
      return await this.login();
    }

    const {
      accessToken,
      refreshToken,
      refreshTokenExpiredTime,
      tokenCreateTime,
      tokenExpiredTime,
    } = this.loginInfo;

    const nowInSecond = Math.floor(Date.now() / 1000);

    const diff = nowInSecond - tokenCreateTime;

    const accessTokenExpired = diff - tokenExpiredTime > TOKEN_EXPIRE_THRESHOLD;
    const refreshTokenExpired =
      diff - refreshTokenExpiredTime > TOKEN_EXPIRE_THRESHOLD;

    if (refreshTokenExpired) {
      return await this.login();
    } else if (accessTokenExpired) {
      return await this.refreshToken(refreshToken);
    } else {
      return accessToken;
    }
  }

  private updateLoginInfo(tokenInfo: TokenInfo) {
    const {
      customerId,
      loginname: loginName,
      refreshToken,
      refreshTokenExpiredTime,
      token: accessToken,
      tokenCreateTime,
      tokenExpiredTime,
    } = tokenInfo;
    this.loginInfo = {
      accessToken,
      customerId,
      loginName,
      refreshToken,
      refreshTokenExpiredTime: parseInt(refreshTokenExpiredTime, 10),
      tokenCreateTime: parseInt(tokenCreateTime, 10),
      tokenExpiredTime: parseInt(tokenExpiredTime, 10),
    };
    return accessToken;
  }
}
