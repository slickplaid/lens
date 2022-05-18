/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { getStartableStoppable } from "../../common/utils/get-startable-stoppable";
import catalogEntityRegistryInjectable from "../catalog/entity-registry.injectable";
import { computed, reaction } from "mobx";
import { broadcastMessage, ipcMainOn } from "../../common/ipc";
import { disposer, toJS } from "../../common/utils";
import { debounce } from "lodash";
import type { CatalogEntity, CatalogEntityData, CatalogEntityKindData } from "../../common/catalog";
import type { EntityPreferencesStore } from "../../common/entity-preferences/store";
import { catalogInitChannel, catalogItemsChannel } from "../../common/ipc/catalog";
import entityPreferencesStoreInjectable from "../../common/entity-preferences/store.injectable";

const changesDueToPreferencesWith = (entityPreferencesStore: EntityPreferencesStore) => (
  ({ metadata, spec, status, kind, apiVersion }: CatalogEntity): CatalogEntityData & CatalogEntityKindData => {
    const preferences = entityPreferencesStore.preferences.get(metadata.uid) ?? {};

    if (preferences.shortName) {
      metadata.shortName = preferences.shortName;
    }

    return { metadata, spec, status, kind, apiVersion };
  }
);

const broadcaster = debounce(
  (items: (CatalogEntityData & CatalogEntityKindData)[]) => broadcastMessage(catalogItemsChannel, items),
  100,
  {
    leading: true,
    trailing: true,
  },
);


const catalogSyncToRendererInjectable = getInjectable({
  id: "catalog-sync-to-renderer",

  instantiate: (di) => {
    const catalogEntityRegistry = di.inject(catalogEntityRegistryInjectable);
    const entityPreferencesStore = di.inject(entityPreferencesStoreInjectable);

    return getStartableStoppable("catalog-sync", () => {
      const entityData = computed(() => toJS(catalogEntityRegistry.items.map(changesDueToPreferencesWith(entityPreferencesStore))));

      return disposer(
        ipcMainOn(catalogInitChannel, () => {
          broadcaster.cancel();
          broadcaster(entityData.get());
        }),
        reaction(() => entityData.get(), broadcaster, {
          fireImmediately: true,
        }),
      );
    });
  },

  causesSideEffects: true,
});

export default catalogSyncToRendererInjectable;
