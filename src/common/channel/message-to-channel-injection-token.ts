/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectionToken } from "@ogre-tools/injectable";
import type { MessageChannel } from "./message-channel-injection-token";

export type MessageToChannel = <
  TChannel extends MessageChannel<unknown>,
>(
  channel: TChannel,
  message?: TChannel["_messageSignature"]
) => void;

export const messageToChannelInjectionToken =
  getInjectionToken<MessageToChannel>({
    id: "message-to-message-channel",
  });
