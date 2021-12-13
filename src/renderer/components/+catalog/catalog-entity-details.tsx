/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import styles from "./catalog-entity-details.module.scss";
import React, { Component } from "react";
import { observer } from "mobx-react";
import { Drawer, DrawerItem } from "../drawer";
import type { CatalogCategory, CatalogEntity } from "../../../common/catalog";
import { Icon } from "../icon";
import { CatalogEntityDrawerMenu } from "./catalog-entity-drawer-menu";
import { CatalogEntityDetailRegistry } from "../../../extensions/registries";
import { isDevelopment } from "../../../common/vars";
import { cssNames } from "../../utils";
import { Avatar } from "../avatar";
import type { GetLabelBadges } from "./get-label-badges.injectable";
import { withInjectables } from "@ogre-tools/injectable-react";
import getLabelBadgesInjectable from "./get-label-badges.injectable";
import { getIconBackground, getIconColourHash } from "../../../common/catalog/helpers";
import { EntityIcon } from "../entity-icon";

export interface CatalogEntityDetailsProps {
  entity: CatalogEntity;
  hideDetails(): void;
  onRun: () => void;
}

interface Dependencies {
  getLabelBadges: GetLabelBadges;
}

@observer
class NonInjectedCatalogEntityDetails extends Component<CatalogEntityDetailsProps & Dependencies> {
  categoryIcon(category: CatalogCategory) {
    if (Icon.isSvg(category.metadata.icon)) {
      return <Icon svg={category.metadata.icon} smallest />;
    } else {
      return <Icon material={category.metadata.icon} smallest />;
    }
  }

  renderContent(entity: CatalogEntity) {
    const { onRun, getLabelBadges } = this.props;
    const detailItems = CatalogEntityDetailRegistry.getInstance().getItemsForKind(entity.kind, entity.apiVersion);
    const details = detailItems.map(({ components }, index) => <components.Details entity={entity} key={index} />);
    const showDefaultDetails = detailItems.find((item) => item.priority ?? 50 > 999) === undefined;

    return (
      <>
        {showDefaultDetails && (
          <div className="flex">
            <div className={styles.entityIcon}>
              <Avatar
                colorHash={getIconColourHash(entity)}
                size={128}
                data-testid="detail-panel-hot-bar-icon"
                background={getIconBackground(entity)}
                onClick={onRun}
                className={styles.avatar}
              >
                <EntityIcon entity={entity} />
              </Avatar>
              {entity?.isEnabled() && (
                <div className={styles.hint}>
                  Click to open
                </div>
              )}
            </div>
            <div className={cssNames("box grow", styles.metadata)}>
              <DrawerItem name="Name">
                {entity.getName()}
              </DrawerItem>
              <DrawerItem name="Kind">
                {entity.kind}
              </DrawerItem>
              <DrawerItem name="Source">
                {entity.getSource()}
              </DrawerItem>
              <DrawerItem name="Status">
                {entity.status.phase}
              </DrawerItem>
              <DrawerItem name="Labels">
                {...getLabelBadges(entity, this.props.hideDetails)}
              </DrawerItem>
              {isDevelopment && (
                <DrawerItem name="Id">
                  {entity.getId()}
                </DrawerItem>
              )}
            </div>
          </div>
        )}
        <div className="box grow">
          {details}
        </div>
      </>
    );
  }

  render() {
    const { entity, hideDetails } = this.props;

    return (
      <Drawer
        className={styles.entityDetails}
        usePortal={true}
        open={true}
        title={`${entity.kind}: ${entity.getName()}`}
        toolbar={<CatalogEntityDrawerMenu entity={entity} key={entity.getId()} />}
        onClose={hideDetails}
      >
        {this.renderContent(entity)}
      </Drawer>
    );
  }
}

export const CatalogEntityDetails = withInjectables<Dependencies, CatalogEntityDetailsProps>(NonInjectedCatalogEntityDetails, {
  getProps: (di, props) => ({
    ...props,
    getLabelBadges: di.inject(getLabelBadgesInjectable),
  }),
});
