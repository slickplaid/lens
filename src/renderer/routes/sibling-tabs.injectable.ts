/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { computed } from "mobx";
import { getInjectable } from "@ogre-tools/injectable";

import sidebarItemsInjectable, {
  HierarchicalSidebarItem,
} from "../components/layout/sidebar-items.injectable";
import { find } from "lodash/fp";
import { pipeline } from "@ogre-tools/fp";

const siblingTabsInjectable = getInjectable({
  id: "sibling-tabs",

  instantiate: (di) => {
    const sidebarItems = di.inject(sidebarItemsInjectable);

    return computed((): HierarchicalSidebarItem[] =>
      pipeline(
        sidebarItems.get(),
        find((asd) => asd.isActive.get()),
        (asd) => asd.children || [],
      ),
    );
  },
});

export default siblingTabsInjectable;
