/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import ipcRendererInjectable from "./ipc-renderer.injectable";
import type { RequestChannel } from "../../common/channel/request-channel-injection-token";

const getValueFromChannelInjectable = getInjectable({
  id: "get-value-from-channel",

  instantiate: (di) => {
    const ipcRenderer = di.inject(ipcRendererInjectable);

    return <TChannel extends RequestChannel<unknown, unknown>>(
      channel: TChannel,
    ): Promise<Required<TChannel>["_responseSignature"]> => ipcRenderer.invoke(channel.id);
  },
});

export default getValueFromChannelInjectable;
