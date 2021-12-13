/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { computed, reaction } from "mobx";
import { broadcastMessage, ipcMainOn } from "../common/ipc";
import type { CatalogEntityRegistry } from "./catalog";
import "../common/catalog-entities/kubernetes-cluster";
import { disposer, toJS } from "../common/utils";
import { debounce } from "lodash";
import type { CatalogEntity, CatalogEntityData, CatalogEntityKindData } from "../common/catalog";
import type { EntityPreferencesStore } from "../common/entity-preferences-store";
import { catalogInitChannel, catalogItemsChannel } from "../common/ipc/catalog";

const changesDueToPreferencesWith = (entityPreferencesStore: EntityPreferencesStore) => (
  ({ metadata, spec, status, kind, apiVersion }: CatalogEntity): CatalogEntityData & CatalogEntityKindData => {
    const preferences = entityPreferencesStore.preferences.get(metadata.uid) ?? {};

    if (preferences.shortName) {
      metadata.shortName = preferences.shortName;
    }

    return { metadata, spec, status, kind, apiVersion };
  }
);

const broadcaster = debounce((items: (CatalogEntityData & CatalogEntityKindData)[]) => {
  broadcastMessage(catalogItemsChannel, items);
}, 100, { leading: true, trailing: true });

export interface Dependencies {
  catalogEntityRegistry: CatalogEntityRegistry;
  entityPreferencesStore: EntityPreferencesStore;
}

export function pushCatalogToRenderer({ catalogEntityRegistry, entityPreferencesStore }: Dependencies) {
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
}
