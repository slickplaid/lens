/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { isString, isObject } from "../../../common/utils";
import { Notifications } from "../notifications";
import React from "react";
import path from "path";
import { SemVer } from "semver";
import URLParse from "url-parse";
import { reduce } from "lodash";
import type { ExtensionInstallationStateStore } from "../../../extensions/extension-installation-state-store/extension-installation-state-store";
import type { Confirm } from "../confirm-dialog/confirm.injectable";
import { getInjectable } from "@ogre-tools/injectable";
import attemptInstallInjectable from "./attempt-install/attempt-install.injectable";
import getBaseRegistryUrlInjectable from "./get-base-registry-url/get-base-registry-url.injectable";
import extensionInstallationStateStoreInjectable from "../../../extensions/extension-installation-state-store/extension-installation-state-store.injectable";
import confirmInjectable from "../confirm-dialog/confirm.injectable";
import type { DownloadJson } from "../../../common/fetch/download-json.injectable";
import type { JsonValue } from "type-fest";
import type { DownloadBinary } from "../../../common/fetch/download-binary.injectable";
import { withTimeout } from "../../../common/fetch/timeout-controller";
import type { AttemptInstall } from "./attempt-install/attempt-install.injectable";
import downloadBinaryInjectable from "../../../common/fetch/download-binary.injectable";
import downloadJsonInjectable from "../../../common/fetch/download-json.injectable";

export interface ExtensionInfo {
  name: string;
  version?: string;
  requireConfirmation?: boolean;
}

export type AttemptInstallByInfo = (info: ExtensionInfo) => Promise<void>;

interface Dependencies {
  attemptInstall: AttemptInstall;
  getBaseRegistryUrl: () => Promise<string>;
  extensionInstallationStateStore: ExtensionInstallationStateStore;
  confirm: Confirm;
  downloadJson: DownloadJson;
  downloadBinary: DownloadBinary;
}

const attemptInstallByInfo = ({
  attemptInstall,
  getBaseRegistryUrl,
  extensionInstallationStateStore,
  confirm,
  downloadJson,
  downloadBinary,
}: Dependencies): AttemptInstallByInfo => (
  async (info) => {
    const { name, version: versionOrTagName, requireConfirmation = false } = info;
    const disposer = extensionInstallationStateStore.startPreInstall();
    const baseUrl = await getBaseRegistryUrl();
    const registryUrl = new URLParse(baseUrl).set("pathname", name).toString();
    let json: JsonValue;

    try {
      const result = await downloadJson(registryUrl);

      if (result.status === "error") {
        Notifications.error(`Failed to get registry information for that extension: ${result.message}`);

        return disposer();
      }

      json = result.data;

      if (!isObject(json)) {
        Notifications.error("Failed to get registry information for that extension");

        return disposer();
      }

      if (json.error || !isObject(json.versions)) {
        const message = json.error ? `: ${json.error}` : "";

        Notifications.error(`Failed to get registry information for that extension${message}`);

        return disposer();
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        // assume invalid JSON
        console.warn("Set registry has invalid json", { url: baseUrl }, error);
        Notifications.error("Failed to get valid registry information for that extension. Registry did not return valid JSON");
      } else {
        console.error("Failed to download registry information", error);
        Notifications.error(`Failed to get valid registry information for that extension. ${error}`);
      }

      return disposer();
    }

    let version = versionOrTagName;

    if (versionOrTagName) {
      validDistTagName: if (!json.versions[versionOrTagName]) {
        const distTags = json["dist-tags"];

        if (isObject(distTags)) {
          const potentialVersion = distTags[versionOrTagName];

          if (isString(potentialVersion)) {
            if (!json.versions[potentialVersion]) {
              Notifications.error((
                <p>
                  Configured registry claims to have tag
                  {" "}
                  <code>{versionOrTagName}</code>
                  .
                  {" "}
                  But does not have version infomation for the reference.
                </p>
              ));

              return disposer();
            }

            version = potentialVersion;
            break validDistTagName;
          }
        }

        Notifications.error((
          <p>
            {"The "}
            <em>{name}</em>
            {" extension does not have a version or tag "}
            <code>{versionOrTagName}</code>
            .
          </p>
        ));

        return disposer();
      }
    } else {
      const versions = Object.keys(json.versions)
        .map(version => new SemVer(version, { loose: true, includePrerelease: true }))
        // ignore pre-releases for auto picking the version
        .filter(version => version.prerelease.length === 0);

      const latestVersion = reduce(versions, (prev, curr) => prev.compareMain(curr) === -1 ? curr : prev);

      version = latestVersion?.format();
    }

    if (!version) {
      console.error("No versions supplied for that extension", { name });
      Notifications.error(`No versions found for ${name}`);

      return disposer();
    }

    const versionInfo = json.versions[version];
    const tarballUrl = isObject(versionInfo) && isObject(versionInfo.dist) && versionInfo.dist.tarball;

    if (!isString(tarballUrl)) {
      Notifications.error("Configured registry has invalid data model. Please verify that it is like NPM's.");
      console.warn(`[ATTEMPT-INSTALL-BY-INFO]: registry returned unexpected data, final version is ${version} but the versions object is missing .dist.tarball as a string`, versionInfo);

      return disposer();
    }

    if (requireConfirmation) {
      const proceed = await confirm({
        message: (
          <p>
            {"Are you sure you want to install "}
            <b>
              {`${name}@${version}`}
            </b>
            ?
          </p>
        ),
        labelCancel: "Cancel",
        labelOk: "Install",
      });

      if (!proceed) {
        return disposer();
      }
    }

    const fileName = path.basename(tarballUrl);
    const { signal } = withTimeout(10 * 60 * 1000);
    const request = await downloadBinary(tarballUrl, { signal });

    if (request.status === "error") {
      Notifications.error(`Failed to download extension: ${request.message}`);

      return disposer();
    }

    return attemptInstall({ fileName, data: request.data }, disposer);
  }
);

const attemptInstallByInfoInjectable = getInjectable({
  id: "attempt-install-by-info",
  instantiate: (di) => attemptInstallByInfo({
    attemptInstall: di.inject(attemptInstallInjectable),
    getBaseRegistryUrl: di.inject(getBaseRegistryUrlInjectable),
    extensionInstallationStateStore: di.inject(extensionInstallationStateStoreInjectable),
    confirm: di.inject(confirmInjectable),
    downloadBinary: di.inject(downloadBinaryInjectable),
    downloadJson: di.inject(downloadJsonInjectable),
  }),
});

export default attemptInstallByInfoInjectable;
