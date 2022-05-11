/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import packageInfo from "../../../package.json";
import type { NativeImage } from "electron";
import { Menu, nativeImage, nativeTheme, Tray } from "electron";
import type { IComputedValue } from "mobx";
import { autorun } from "mobx";
import logger from "../logger";
import { isWindows } from "../../common/vars";
import type { Disposer } from "../../common/utils";
import { base64, disposer, getOrInsertWithAsync } from "../../common/utils";
import sharp from "sharp";
import LogoLens from "../../renderer/components/icon/logo-lens.svg";
import { JSDOM } from "jsdom";
import type { TrayMenuItem } from "./tray-menu-item/tray-menu-item-injection-token";
import { pipeline } from "@ogre-tools/fp";
import { filter, isEmpty, map } from "lodash/fp";

export const TRAY_LOG_PREFIX = "[TRAY]";

// note: instance of Tray should be saved somewhere, otherwise it disappears
export let tray: Tray;

interface CreateTrayIconArgs {
  shouldUseDarkColors: boolean;
  size: number;
  sourceSvg: string;
}

const trayIcons = new Map<boolean, NativeImage>();

async function createTrayIcon({ shouldUseDarkColors, size, sourceSvg }: CreateTrayIconArgs): Promise<NativeImage> {
  return getOrInsertWithAsync(trayIcons, shouldUseDarkColors, async () => {
    const trayIconColor = shouldUseDarkColors ? "white" : "black"; // Invert to show contrast
    const parsedSvg = base64.decode(sourceSvg.split("base64,")[1]);
    const svgDom = new JSDOM(`<body>${parsedSvg}</body>`);
    const svgRoot = svgDom.window.document.body.getElementsByTagName("svg")[0];

    svgRoot.innerHTML += `<style>* {fill: ${trayIconColor} !important;}</style>`;

    const iconBuffer = await sharp(Buffer.from(svgRoot.outerHTML))
      .resize({ width: size, height: size })
      .png()
      .toBuffer();

    return nativeImage.createFromBuffer(iconBuffer);
  });
}

function createCurrentTrayIcon() {
  return createTrayIcon({
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    size: 16,
    sourceSvg: LogoLens,
  });
}

function watchShouldUseDarkColors(tray: Tray): Disposer {
  let prevShouldUseDarkColors = nativeTheme.shouldUseDarkColors;
  const onUpdated = () => {
    if (prevShouldUseDarkColors !== nativeTheme.shouldUseDarkColors) {
      prevShouldUseDarkColors = nativeTheme.shouldUseDarkColors;
      createCurrentTrayIcon()
        .then(img => tray.setImage(img));
    }
  };

  nativeTheme.on("updated", onUpdated);

  return () => nativeTheme.off("updated", onUpdated);
}

export async function initTray(
  trayMenuItems: IComputedValue<TrayMenuItem[]>,
  showApplicationWindow: () => Promise<void>,
): Promise<Disposer> {
  const icon = await createCurrentTrayIcon();
  const dispose = disposer();

  tray = new Tray(icon);
  tray.setToolTip(packageInfo.description);
  tray.setIgnoreDoubleClickEvents(true);

  dispose.push(watchShouldUseDarkColors(tray));

  if (isWindows) {
    tray.on("click", () => {
      showApplicationWindow()
        .catch(error => logger.error(`${TRAY_LOG_PREFIX}: Failed to open lens`, { error }));
    });
  }

  dispose.push(
    autorun(() => {
      try {
        const options = toTrayMenuOptions(trayMenuItems.get());

        const menu = Menu.buildFromTemplate(options);

        tray.setContextMenu(menu);
      } catch (error) {
        logger.error(`${TRAY_LOG_PREFIX}: building failed`, { error });
      }
    }),
    () => {
      tray?.destroy();
      tray = null;
    },
  );

  return dispose;
}

const toTrayMenuOptions = (trayMenuItems: TrayMenuItem[]) => {
  const _toTrayMenuOptions = (parentId: string | null) =>
    pipeline(
      trayMenuItems,

      filter((item) => item.parentId === parentId),

      map(
        (trayMenuItem: TrayMenuItem): Electron.MenuItemConstructorOptions => {
          if (trayMenuItem.separator) {
            return { id: trayMenuItem.id, type: "separator" };
          }

          const childItems = _toTrayMenuOptions(trayMenuItem.id);

          return {
            id: trayMenuItem.id,
            label: trayMenuItem.label.get(),
            enabled: trayMenuItem.enabled.get(),
            toolTip: trayMenuItem.tooltip,

            ...(isEmpty(childItems)
              ? {
                type: "normal",
                submenu: _toTrayMenuOptions(trayMenuItem.id),

                click: () => {
                  try {
                    trayMenuItem.click?.();
                  } catch (error) {
                    logger.error(
                      `${TRAY_LOG_PREFIX}: clicking item "${trayMenuItem.id} failed."`,
                      { error },
                    );
                  }
                },
              }
              : {
                type: "submenu",
                submenu: _toTrayMenuOptions(trayMenuItem.id),
              }),

          };
        },
      ),
    );

  return _toTrayMenuOptions(null);
};

