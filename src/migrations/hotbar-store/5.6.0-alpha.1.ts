/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { computeDefaultShortName } from "../../common/catalog/helpers";
import type { Hotbar } from "../../common/hotbars/types";
import type { MigrationDeclaration } from "../helpers";

export default {
  version: "5.6.0-alpha.1",
  run(store) {
    const hotbars: Hotbar[] = store.get("hotbars") ?? [];

    for (const hotbar of hotbars) {
      for (const item of hotbar.items) {
        if (item) {
          item.entity.shortName ??= computeDefaultShortName(item.entity.name);
        }
      }
    }

    store.set("hotbars", hotbars);
  },
} as MigrationDeclaration;
