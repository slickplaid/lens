/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { EntitySettingRegistry } from "../../extensions/registries";
import * as clusterSettings from "../components/cluster-settings";
import * as entitySettings from "../components/entity-settings/short-name-setting";

export function initEntitySettingsRegistry() {
  EntitySettingRegistry.getInstance()
    .add([
      {
        apiVersions: ["entity.k8slens.dev/v1alpha1"],
        kind: "KubernetesCluster",
        source: "local",
        title: "General",
        group: "Settings",
        components: {
          View: clusterSettings.GeneralSettings,
        },
      },
      {
        apiVersions: ["entity.k8slens.dev/v1alpha1"],
        kind: "KubernetesCluster",
        title: "Proxy",
        group: "Settings",
        components: {
          View: clusterSettings.ProxySettings,
        },
      },
      {
        apiVersions: ["entity.k8slens.dev/v1alpha1"],
        kind: "KubernetesCluster",
        title: "Terminal",
        group: "Settings",
        components: {
          View: clusterSettings.TerminalSettings,
        },
      },
      {
        apiVersions: ["entity.k8slens.dev/v1alpha1"],
        kind: "KubernetesCluster",
        title: "Namespaces",
        group: "Settings",
        components: {
          View: clusterSettings.NamespacesSettings,
        },
      },
      {
        apiVersions: ["entity.k8slens.dev/v1alpha1"],
        kind: "KubernetesCluster",
        title: "Metrics",
        group: "Settings",
        components: {
          View: clusterSettings.MetricsSettings,
        },
      },
      {
        apiVersions: ["entity.k8slens.dev/v1alpha1"],
        kind: "KubernetesCluster",
        title: "Node Shell",
        group: "Settings",
        components: {
          View: clusterSettings.NodeShellSettings,
        },
      },
      {
        apiVersions: "*",
        kind: "*",
        title: "Short Name",
        group: "Settings",
        components: {
          View: entitySettings.ShortNameSetting,
        },
      },
    ]);
}
