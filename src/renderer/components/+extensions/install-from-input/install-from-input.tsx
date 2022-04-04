/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { ExtendableDisposer } from "../../../../common/utils";
import { InputValidators } from "../../input";
import { getMessageFromError } from "../get-message-from-error/get-message-from-error";
import logger from "../../../../main/logger";
import { Notifications } from "../../notifications";
import path from "path";
import React from "react";
import { readFileNotify } from "../read-file-notify/read-file-notify";
import type { AttemptInstallByInfo } from "../attempt-install-by-info.injectable";
import type { ExtensionInstallationStateStore } from "../../../../extensions/extension-installation-state-store/extension-installation-state-store";
import { AsyncInputValidationError } from "../../input/input_validators";
import type { AttemptInstall } from "../attempt-install/attempt-install.injectable";
import type { DownloadBinary } from "../../../../common/fetch/download-binary.injectable";
import { withTimeout } from "../../../../common/fetch/timeout-controller";

export type InstallFromInput = (input: string) => Promise<void>;

interface Dependencies {
  attemptInstall: AttemptInstall;
  attemptInstallByInfo: AttemptInstallByInfo;
  extensionInstallationStateStore: ExtensionInstallationStateStore;
  downloadBinary: DownloadBinary;
}

export const installFromInput = ({
  attemptInstall,
  attemptInstallByInfo,
  extensionInstallationStateStore,
  downloadBinary,
}: Dependencies): InstallFromInput => (
  async (input) => {
    let disposer: ExtendableDisposer | undefined = undefined;

    try {
      // fixme: improve error messages for non-tar-file URLs
      if (InputValidators.isUrl.validate(input)) {
        // install via url
        disposer = extensionInstallationStateStore.startPreInstall();
        const { signal } = withTimeout(10 * 60 * 1000);
        const result = await downloadBinary(input, { signal });

        if (result.status === "error") {
          Notifications.error(`Failed to download extension: ${result.message}`);

          return disposer();
        }

        const fileName = path.basename(input);

        return await attemptInstall({ fileName, data: result.data }, disposer);
      }

      try {
        await InputValidators.isPath.validate(input);

        // install from system path
        const fileName = path.basename(input);
        const data = await readFileNotify(input);

        if (!data) {
          return;
        }

        return await attemptInstall({ fileName, data });
      } catch (error) {
        if (error instanceof AsyncInputValidationError) {
          const extNameCaptures = InputValidators.isExtensionNameInstallRegex.captures(input);

          if (extNameCaptures) {
            const { name, version } = extNameCaptures;

            return await attemptInstallByInfo({ name, version });
          }
        } else {
          throw error;
        }
      }

      throw new Error(`Unknown format of input: ${input}`);
    } catch (error) {
      const message = getMessageFromError(error);

      logger.info(`[EXTENSION-INSTALL]: installation has failed: ${message}`, { error, installPath: input });
      Notifications.error((
        <p>
          {"Installation has failed: "}
          <b>{message}</b>
        </p>
      ));
    } finally {
      disposer?.();
    }
  }
);
