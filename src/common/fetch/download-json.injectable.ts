/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import type { Response } from "node-fetch";
import type { JsonValue } from "type-fest";
import fetchInjectable from "./fetch.injectable";

export type DownloadJsonResult = {
  readonly status: "success";
  readonly data: JsonValue;
} | {
  readonly status: "error";
  readonly message: string;
};

export interface DownloadJsonOptions {
  signal?: AbortSignal | null | undefined;
}

export type DownloadJson = (url: string, opts?: DownloadJsonOptions) => Promise<DownloadJsonResult>;

const downloadJsonInjectable = getInjectable({
  id: "download-json",
  instantiate: (di): DownloadJson => {
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
          data: await result.json(),
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

export default downloadJsonInjectable;
