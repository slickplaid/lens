/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import attemptInstallInjectable from "./attempt-install/attempt-install.injectable";
import { readFileNotify } from "./read-file-notify/read-file-notify";
import path from "path";

export type AttemptInstalls = (filePaths: string[]) => Promise<void>;

const attemptInstallsInjectable = getInjectable({
  id: "attempt-installs",

  instantiate: (di): AttemptInstalls => {
    const attemptInstall = di.inject(attemptInstallInjectable);

    return async (filePaths) => {
      await Promise.allSettled(
        filePaths.map(async filePath => {
          const data = await readFileNotify(filePath);

          if (!data) {
            return;
          }

          return attemptInstall({
            fileName: path.basename(filePath),
            data,
          });
        }),
      );
    };
  },
});

export default attemptInstallsInjectable;
