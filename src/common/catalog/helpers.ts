/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { CatalogEntity } from "./catalog-entity";
import GraphemeSplitter from "grapheme-splitter";
import { hasOwnProperty, hasTypedProperty, isObject, isString, iter } from "../utils";

function getNameParts(name: string): string[] {
  const byWhitespace = name.split(/\s+/);

  if (byWhitespace.length > 1) {
    return byWhitespace;
  }

  const byDashes = name.split(/[-_]+/);

  if (byDashes.length > 1) {
    return byDashes;
  }

  return name.split(/@+/);
}

export function computeDefaultShortName(name: string) {
  if (!name || typeof name !== "string") {
    return "??";
  }

  const [rawFirst, rawSecond, rawThird] = getNameParts(name);
  const splitter = new GraphemeSplitter();
  const first = splitter.iterateGraphemes(rawFirst);
  const second = rawSecond ? splitter.iterateGraphemes(rawSecond): first;
  const third = rawThird ? splitter.iterateGraphemes(rawThird) : iter.newEmpty();

  return [
    ...iter.take(first, 1),
    ...iter.take(second, 1),
    ...iter.take(third, 1),
  ].filter(Boolean).join("");
}

export function getShortName(entity: CatalogEntity): string {
  return entity.metadata.shortName || computeDefaultShortName(entity.getName());
}

export function getIconColourHash(entity: CatalogEntity): string {
  return `${entity.metadata.name}-${entity.metadata.source}`;
}

export function getIconBackground(entity: CatalogEntity): string | undefined {
  if (isObject(entity.spec.icon)) {
    if (hasTypedProperty(entity.spec.icon, "background", isString)) {
      return entity.spec.icon.background;
    }

    return hasOwnProperty(entity.spec.icon, "src")
      ? "transparent"
      : undefined;
  }

  return undefined;
}

export function getIconMaterial(entity: CatalogEntity): string | undefined {
  if (
    isObject(entity.spec.icon)
    && hasTypedProperty(entity.spec.icon, "material", isString)
  ) {
    return entity.spec.icon.material;
  }

  return undefined;
}
