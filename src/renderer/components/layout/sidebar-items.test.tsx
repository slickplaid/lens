/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { DiContainer } from "@ogre-tools/injectable";
import { getDiForUnitTesting } from "../../getDiForUnitTesting";
import directoryForUserDataInjectable from "../../../common/app-paths/directory-for-user-data/directory-for-user-data.injectable";
import currentlyInClusterFrameInjectable from "../../routes/currently-in-cluster-frame.injectable";
import kubeWatchApiInjectable from "../../kube-watch-api/kube-watch-api.injectable";
import type { KubeWatchApi } from "../../kube-watch-api/kube-watch-api";
import hostedClusterInjectable from "../../../common/cluster-store/hosted-cluster.injectable";
import type { Cluster } from "../../../common/cluster/cluster";
import { renderFor } from "../test-utils/renderFor";
import React from "react";
import { fireEvent, RenderResult } from "@testing-library/react";
import { Router } from "react-router";
import observableHistoryInjectable from "../../navigation/observable-history.injectable";
import sidebarStorageInjectable from "./sidebar-storage/sidebar-storage.injectable";
import type { StorageHelper } from "../../utils";
import { computed, observable } from "mobx";
import { LensRendererExtension } from "../../../extensions/lens-renderer-extension";
import type {
  ClusterPageMenuRegistration,
  PageRegistration,
} from "../../../extensions/registries";
import rendererExtensionsInjectable from "../../../extensions/renderer-extensions.injectable";

import extensionSidebarItemRegistratorInjectable from "./extension-sidebar-item-registrator.injectable";
import extensionRouteRegistratorInjectable from "../../routes/extension-route-registrator.injectable";
import { Sidebar } from "./sidebar";
import currentRouteComponentInjectable from "../../routes/current-route-component.injectable";
import { Observer } from "mobx-react";

describe("sidebar-items", () => {
  let di: DiContainer;
  let rendered: RenderResult;
  let sidebarStorageStateStub: { expanded: {}; width: number };

  beforeEach(async () => {
    di = getDiForUnitTesting({ doGeneralOverrides: true });

    di.override(directoryForUserDataInjectable, () => "irrelevant");
    di.override(currentlyInClusterFrameInjectable, () => true);

    di.override(
      kubeWatchApiInjectable,
      () => ({ subscribeStores: () => () => {} } as unknown as KubeWatchApi),
    );

    di.override(
      hostedClusterInjectable,
      () => ({ allowedResources: [] } as Cluster),
    );

    const testExtension = new TestExtension({
      id: "some-extension-id",

      clusterPages: [
        {
          components: {
            Page: () => {
              throw new Error("should never come here");
            },
          },
        },

        {
          id: "some-child-page-id",

          components: {
            Page: () => <div data-testid="child-page">Some child page</div>,
          },
        },
      ],

      clusterPageMenus: [
        {
          id: "some-parent-id",
          title: "Parent",

          components: {
            Icon: () => <div>Some icon</div>,
          },
        },

        {
          id: "some-child-id",
          target: { pageId: "some-child-page-id" },
          parentId: "some-parent-id",
          title: "Child 1",

          components: {
            Icon: null,
          },
        },

        {
          id: "some-other-child-id",
          target: { pageId: "some-child-page-id" },
          parentId: "some-parent-id",
          title: "Child 2",

          components: {
            Icon: null,
          },
        },
      ],
    });

    di.override(rendererExtensionsInjectable, () =>
      computed(() => [testExtension]),
    );

    sidebarStorageStateStub = observable({
      expanded: {},
      width: 420,
    });

    di.override(
      sidebarStorageInjectable,
      () =>
        ({
          get: () => sidebarStorageStateStub,
          merge: (doMerge: (state: any) => void) => {
            doMerge(sidebarStorageStateStub);
          },
        } as StorageHelper<any>),
    );

    await di.runSetups();

    const extensionRouteRegistrator = di.inject(
      extensionRouteRegistratorInjectable,
    );

    const extensionSidebarItemRegistrator = di.inject(
      extensionSidebarItemRegistratorInjectable,
    );

    await Promise.all([
      extensionRouteRegistrator(testExtension, 1),
      extensionSidebarItemRegistrator(testExtension, 1),
    ]);

    const render = renderFor(di);

    const history = di.inject(observableHistoryInjectable);
    const currentRouteComponent = di.inject(currentRouteComponentInjectable);

    rendered = render(
      <Router history={history}>
        <Sidebar />

        <Observer>
          {() => {
            const Component = currentRouteComponent.get();

            if (!Component) {
              return null;
            }

            return <Component />;
          }}
        </Observer>
      </Router>,
    );
  });

  it("renders", () => {
    expect(rendered.container).toMatchSnapshot();
  });

  it("parent is not highlighted", () => {
    const parent = rendered.getByTestId(
      "sidebar-item-for-some-extension-id-some-parent-id",
    );

    expect(parent.dataset.isActive).toBe("false");
  });

  it("child of parent is not rendered", () => {
    const child = rendered.queryByTestId(
      "sidebar-item-for-some-extension-id-some-child-id",
    );

    expect(child).toBe(null);
  });

  describe("when a parent item is opened", () => {
    beforeEach(() => {
      const parentLink = rendered.getByTestId(
        "sidebar-item-link-for-some-extension-id-some-parent-id",
      );

      fireEvent.click(parentLink);
    });

    it("renders", () => {
      expect(rendered.container).toMatchSnapshot();
    });

    it("parent is not highlighted", () => {
      const parent = rendered.getByTestId(
        "sidebar-item-for-some-extension-id-some-parent-id",
      );

      expect(parent.dataset.isActive).toBe("false");
    });

    it("child of parent is rendered", () => {
      const child = rendered.queryByTestId(
        "sidebar-item-for-some-extension-id-some-child-id",
      );

      expect(child).not.toBe(null);
    });

    describe("when a child of the parent is selected", () => {
      beforeEach(() => {
        const childLink = rendered.getByTestId(
          "sidebar-item-link-for-some-extension-id-some-child-id",
        );

        fireEvent.click(childLink);
      });

      it("renders", () => {
        expect(rendered.container).toMatchSnapshot();
      });

      it("parent is highlighted", () => {
        const parent = rendered.getByTestId(
          "sidebar-item-for-some-extension-id-some-parent-id",
        );

        expect(parent.dataset.isActive).toBe("true");
      });

      it("child is highlighted", () => {
        const child = rendered.getByTestId(
          "sidebar-item-for-some-extension-id-some-child-id",
        );

        expect(child.dataset.isActive).toBe("true");
      });

      it("child page is shown", () => {
        expect(rendered.getByTestId("child-page")).not.toBeNull();
      });

      it("renders tabs", () => {
        expect(rendered.getByTestId("tab-layout")).not.toBeNull();
      });

      describe("sidebar", () => {

      });
    });
  });
});

class TestExtension extends LensRendererExtension {
  constructor({
    id,
    clusterPageMenus,
    clusterPages,
  }: {
    id: string;
    clusterPageMenus: ClusterPageMenuRegistration[];
    clusterPages: PageRegistration[];
  }) {
    super({
      id,
      absolutePath: "irrelevant",
      isBundled: false,
      isCompatible: false,
      isEnabled: false,
      manifest: { name: id, version: "some-version" },
      manifestPath: "irrelevant",
    });

    this.clusterPageMenus = clusterPageMenus;
    this.clusterPages = clusterPages;
  }
}
