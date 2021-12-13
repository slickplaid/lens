/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import type { EntitySettingViewProps } from "../../../extensions/registries";
import { SubTitle } from "../layout/sub-title";
import { Input } from "../input";
import { EntityPreferencesStore } from "../../../common/entity-preferences-store";
import { computeDefaultShortName } from "../../../common/catalog/helpers";

export const ShortNameSetting = observer(({ entity }: EntitySettingViewProps) => {
  const [shortName, setShortName] = useState(entity.metadata.shortName ?? "");
  const store = EntityPreferencesStore.getInstance();

  return (
    <section>
      <section>
        <SubTitle title="Entity Short Name" />
        <Input
          theme="round-black"
          value={shortName}
          placeholder={computeDefaultShortName(entity.getName())}
          onChange={setShortName}
          onBlur={() => store.mergePreferences(entity.getId(), { shortName })}
        />
        <small className="hint">
          The text for entity icons. By default it is calculated from the entity name.
        </small>
      </section>
    </section>
  );
});
