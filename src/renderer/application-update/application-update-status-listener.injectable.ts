/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import applicationUpdateStatusChannelInjectable from "../../common/application-update/application-update-status-channel.injectable";
import showInfoNotificationInjectable from "../components/notifications/show-info-notification.injectable";
import { getMessageChannelListenerInjectable } from "../../common/utils/channel/message-channel-listener-injection-token";

const applicationUpdateStatusListenerInjectable = getMessageChannelListenerInjectable(applicationUpdateStatusChannelInjectable, (di) => {
  const showInfoNotification = di.inject(showInfoNotificationInjectable);

  return (message) => {
    switch (message.eventId) {
      case "checking-for-updates":
        showInfoNotification("Checking for updates...");
        break;
      case "no-updates-available":
        showInfoNotification("No new updates available");
        break;
      case "download-for-update-started":
        showInfoNotification(`Download for version ${message.version} started...`);
        break;
      case "download-for-update-failed":
        showInfoNotification("Download of update failed");
        break;
    }
  };
});

export default applicationUpdateStatusListenerInjectable;
