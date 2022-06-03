/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { lensWindowInjectionToken } from "../../start-main-application/lens-window/application-window/lens-window-injection-token";
import { getInjectable } from "@ogre-tools/injectable";
import type { MessageToChannel } from "../../../common/utils/channel/message-to-channel-injection-token";
import { messageToChannelInjectionToken } from "../../../common/utils/channel/message-to-channel-injection-token";

const messageToChannelInjectable = getInjectable({
  id: "message-to-channel",

  instantiate: (di) => {
    const getAllLensWindows = () => di.injectMany(lensWindowInjectionToken);

    return ((channel, message) => {
      for (const window of getAllLensWindows()) {
        if (!window.visible) {
          continue;
        }

        window.send({ channel: channel.id, data: message !== undefined ? [message] : [] });
      }
    }) as MessageToChannel;
  },

  injectionToken: messageToChannelInjectionToken,
});

export default messageToChannelInjectable;
