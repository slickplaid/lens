/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { orderBy } from "lodash";
import type React from "react";
import type { CatalogEntity } from "../../common/catalog";
import { BaseRegistry } from "./base-registry";

export interface EntitySettingViewProps {
  entity: CatalogEntity;
}

export interface EntitySettingComponents {
  View: React.ComponentType<EntitySettingViewProps>;
}

export interface EntitySettingRegistration {
  /**
   * The list of apiVersions for this setting. This is an additive list. If the
   * value is `"*"` then it will match all versions.
   */
  apiVersions: string[] | "*";

  /**
   * The kind of entity. If this is `"*"` then it will match all kinds.
   */
  kind: string;

  /**
   * The heading for this setting
   */
  title: string;
  components: EntitySettingComponents;

  /**
   * If set then only entities with `.source` matching this value will have
   * this setting.
   */
  source?: string;

  /**
   * The ID for the setting area for use with navigation links. If not provided
   * then it will default to the lowercase version of `.title`.
   */
  id?: string;

  /**
   * The sorting order placement for this component.
   *
   * @default 50
   */
  priority?: number;

  /**
   * The section of the settings to be put under.
   */
  group?: string;
}

export interface RegisteredEntitySetting extends Omit<EntitySettingRegistration, "apiVersions"> {
  id: string;
  priority: number;
  /**
   * If `true` then this item matches all versions, otherwise is a set of versions it supports
   */
  apiVersions: Set<string> | true;
}

export class EntitySettingRegistry extends BaseRegistry<EntitySettingRegistration, RegisteredEntitySetting> {
  getRegisteredItem({ apiVersions, priority = 50, ...item }: EntitySettingRegistration): RegisteredEntitySetting {
    return {
      id: item.id || item.title.toLowerCase(),
      priority,
      apiVersions: apiVersions === "*" ? true : new Set(apiVersions),
      ...item,
    };
  }

  /**
   *
   * @param kind The kind of the entity to get setting items for
   * @param apiVersion The version of the entity kind to get setting items for
   * @param source If present then only items for a specific source will be returned
   * @returns A list of registr
   */
  getItemsForKind(kind: string, apiVersion: string, source?: string): RegisteredEntitySetting[] {
    let items = this.getItems().filter(item => {
      const kindMatches = item.kind === "*" || item.kind === kind;
      const versionMatches = item.apiVersions === true || item.apiVersions.has(apiVersion);

      return kindMatches && versionMatches;
    });

    if (source) {
      items = items.filter((item) => !item.source || item.source === source);
    }

    return orderBy(items, "priority", "desc");
  }
}
