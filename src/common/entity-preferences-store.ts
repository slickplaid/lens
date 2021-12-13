/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { merge } from "lodash";
import { action, makeObservable, observable } from "mobx";
import type { PartialDeep } from "type-fest";
import { BaseStore } from "./base-store";
import logger from "./logger";

export interface EntityPreferencesModel {
  /**
   * Is used for displaying entity icons.
   */
  shortName?: string;
}

export interface EntityPreferencesStoreModel {
  entities?: [string, EntityPreferencesModel][];
}

export class EntityPreferencesStore extends BaseStore<EntityPreferencesStoreModel> {
  @observable preferences = observable.map<string, PartialDeep<EntityPreferencesModel>>();

  constructor() {
    super({
      configName: "lens-entity-preferences-store",
    });

    makeObservable(this);
    this.load();
  }

  @action
  mergePreferences(entityId: string, preferences: PartialDeep<EntityPreferencesModel>): void {
    this.preferences.set(entityId, merge(this.preferences.get(entityId), preferences));
  }

  @action
  protected fromStore(data: EntityPreferencesStoreModel): void {
    logger.debug("EntityPreferencesStore.fromStore()", data);

    this.preferences.replace(data.entities ?? []);
  }

  toJSON(): EntityPreferencesStoreModel {
    return {
      entities: this.preferences.toJSON(),
    };
  }
}
