/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { EntityPreferencesStore } from "./store";

const entityPreferencesStoreInjectable = getInjectable({
  id: "entity-preferences-store",
  instantiate: () => {
    EntityPreferencesStore.resetInstance();

    return EntityPreferencesStore.createInstance();
  },
});

export default entityPreferencesStoreInjectable;
