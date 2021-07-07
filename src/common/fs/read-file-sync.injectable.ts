/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import type { readFileSync } from "fs-extra";
import fsInjectable from "./fs.injectable";

export type ReadFileSync = typeof readFileSync;

const readFileSyncInjectable = getInjectable({
  id: "read-file-sync",
  instantiate: (di) => di.inject(fsInjectable).readFileSync,
});

export default readFileSyncInjectable;
