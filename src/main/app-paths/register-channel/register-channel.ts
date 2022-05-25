/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { IpcMain } from "electron";
import type { RequestChannel } from "../../../common/channel/request-channel-injection-token";

interface Dependencies {
  ipcMain: IpcMain;
}

export const registerChannel =
  ({ ipcMain }: Dependencies) =>
  <TChannel extends RequestChannel<unknown, unknown>>(
      channel: TChannel,
      getValue: () => TChannel["_responseSignature"],
    ) =>
      ipcMain.handle(channel.id, getValue);
