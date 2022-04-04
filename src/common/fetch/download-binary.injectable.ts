/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import type { Response } from "node-fetch";
import fetchInjectable from "./fetch.injectable";

export type DownloadBinaryResult = {
  readonly status: "success";
  readonly data: Buffer;
} | {
  readonly status: "error";
  readonly message: string;
};

export interface DownloadBinaryOptions {
  signal?: AbortSignal | null | undefined;
}

export type DownloadBinary = (url: string, opts?: DownloadBinaryOptions) => Promise<DownloadBinaryResult>;

const downloadBinaryInjectable = getInjectable({
  id: "download-binary",
  instantiate: (di): DownloadBinary => {
    const fetch = di.inject(fetchInjectable);

    return async (url, opts) => {
      let result: Response;

      try {
        result = await fetch(url, opts);
      } catch (error) {
        return {
          status: "error",
          message: String(error),
        };
      }

      if (result.status < 200 || 300 <= result.status) {
        return {
          status: "error",
          message: result.statusText,
        };
      }

      try {
        return {
          status: "success",
          data: await result.buffer(),
        };
      } catch (error) {
        return {
          status: "error",
          message: String(error),
        };
      }
    };
  },
});

export default downloadBinaryInjectable;
