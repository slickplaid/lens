/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { DiContainer } from "@ogre-tools/injectable";
import getValueFromChannelInjectable from "../renderer/channel/get-value-from-channel.injectable";
import registerChannelInjectable from "../main/app-paths/register-channel/register-channel.injectable";
import asyncFn from "@async-fn/jest";
import type { SendToViewArgs } from "../main/start-main-application/lens-window/application-window/lens-window-injection-token";
import sendToChannelInElectronBrowserWindowInjectable from "../main/start-main-application/lens-window/application-window/send-to-channel-in-electron-browser-window.injectable";
import { isEmpty } from "lodash/fp";
import enlistMessageChannelListenerInjectableInRenderer from "../renderer/channel/channel-listeners/enlist-message-channel-listener.injectable";
import enlistMessageChannelListenerInjectableInMain from "../main/channel/channel-listeners/enlist-message-channel-listener.injectable";
import enlistRequestChannelListenerInjectableInMain from "../main/channel/channel-listeners/enlist-request-channel-listener.injectable";
import sendToMainInjectable from "../renderer/channel/send-to-main.injectable";
import type { RequestChannel } from "../common/channel/request-channel-injection-token";

export const overrideIpcBridge = ({
  rendererDi,
  mainDi,
}: {
  rendererDi: DiContainer;
  mainDi: DiContainer;
}) => {
  const fakeRequestChannelMap = new Map<
    string,
    { promise: Promise<any>; resolve: (arg0: any) => Promise<void> }
  >();

  const requestChannelListenerFakesForMain = {
    set: <TChannel extends RequestChannel<unknown, unknown>>(
      channel: TChannel,
      callback: () => TChannel["_responseSignature"],
    ) => {
      const id = channel.id;

      if (!fakeRequestChannelMap.has(id)) {
        const mockInstance = asyncFn();

        fakeRequestChannelMap.set(id, {
          promise: mockInstance(),
          resolve: mockInstance.resolve,
        });
      }

      return fakeRequestChannelMap.get(id)?.resolve(callback);
    },

    get: <TChannel extends RequestChannel<unknown, unknown>>(channel: TChannel) => {
      const id = channel.id;

      if (!fakeRequestChannelMap.has(id)) {
        const mockInstance = asyncFn();

        fakeRequestChannelMap.set(id, {
          promise: mockInstance(),
          resolve: mockInstance.resolve,
        });
      }

      return fakeRequestChannelMap.get(id)?.promise;
    },
  };

  rendererDi.override(
    getValueFromChannelInjectable,

    () => async (channel) => {
      const callback = await requestChannelListenerFakesForMain.get(channel);

      return callback();
    },
  );

  mainDi.override(registerChannelInjectable, () => (channel, listener) => {
    requestChannelListenerFakesForMain.set(channel, listener);
  });

  const messageChannelListenerFakesForRenderer = new Map<
    string,
    ((...args: any[]) => void)[]
  >();

  mainDi.override(
    sendToChannelInElectronBrowserWindowInjectable,

    () =>
      (browserWindow, { channel: channelName, data = [] }: SendToViewArgs) => {
        const listeners = messageChannelListenerFakesForRenderer.get(channelName) || [];

        if (isEmpty(listeners)) {
          throw new Error(
            `Tried to send message to channel "${channelName}" but there where no listeners. Current channels with listeners: "${[
              ...messageChannelListenerFakesForRenderer.keys(),
            ].join('", "')}"`,
          );
        }

        listeners.forEach((handle) => handle(...data));
      },
  );

  const messageChannelListenerFakesForMain = new Map<
    string,
    ((...args: any[]) => void)[]
  >();

  const requestChannelListenerFakesForMain = new Map<
    string,
    ((...args: any[]) => any)[]
  >();

  rendererDi.override(
    enlistMessageChannelListenerInjectableInRenderer,

    () =>
      ({ channel, handler: newListener }) => {
        const oldListeners = messageChannelListenerFakesForRenderer.get(channel.id) || [];

        messageChannelListenerFakesForRenderer.set(channel.id, [...oldListeners, newListener]);

        return () => {};
      },
  );

  rendererDi.override(sendToMainInjectable, () => (channelId, message) => {
    const listeners = messageChannelListenerFakesForMain.get(channelId) || [];

    if (isEmpty(listeners)) {
      throw new Error(
        `Tried to send message to channel "${channelId}" but there where no listeners. Current channels with listeners: "${[
          ...messageChannelListenerFakesForMain.keys(),
        ].join('", "')}"`,
      );
    }

    listeners.forEach((handle) => handle(message));
  });

  mainDi.override(
    enlistMessageChannelListenerInjectableInMain,

    () =>
      ({ channel, handler: newListener }) => {
        const oldListeners = messageChannelListenerFakesForMain.get(channel.id) || [];

        messageChannelListenerFakesForMain.set(channel.id, [...oldListeners, newListener]);

        return () => {};
      },
  );

  mainDi.override(
    enlistRequestChannelListenerInjectableInMain,

    () =>
      ({ channel, handler }) => {
        // const existingHandles = mainIpcFakeHandles.get(channel.id) || [];

        // mainIpcFakeHandles.set(channel.id, [...existingHandles, handler]);

        return () => {};
      },
  );
};
