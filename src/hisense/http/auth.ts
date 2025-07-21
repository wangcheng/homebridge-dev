import ky from "ky";
import { URLSearchParams } from "node:url";

import type { TokenInfo } from "../types.js";
import type { ServerResA } from "./base-types.js";

import { HisenseApiError } from "./HisenseApiError.js";

const URL_LOGIN = "https://portal-account.hismarttv.com/mobile/signon";
const URL_REFRESH = "https://bas-wg.hismarttv.com/aaa/refresh_token2";
const REFRESH_APP_KEY = "1234567890";

interface LoginReq {
  loginName: string;
  signature: string;
}

type LoginRes = ServerResA<{
  tokenInfo: TokenInfo & { signatureServer: string };
}>;

export const requestLogin = async (req: LoginReq): Promise<TokenInfo> => {
  const response = await ky.post<LoginRes>(URL_LOGIN, { json: req }).json();
  if (response.data?.resultCode === 0) {
    return response.data.tokenInfo;
  } else {
    throw new HisenseApiError("requestLogin", response);
  }
};

type RefreshTokenRes = (TokenInfo & { resultCode: number })[];

export const requestRefreshToken = async (
  refreshToken: string
): Promise<TokenInfo> => {
  const response = await ky
    .post<RefreshTokenRes>(URL_REFRESH, {
      body: new URLSearchParams({
        appKey: REFRESH_APP_KEY,
        format: "1",
        refreshToken,
      }),
    })
    .json();
  if (!response[0]) {
    throw new HisenseApiError("requestRefreshToken", response);
  }
  return response[0];
};
