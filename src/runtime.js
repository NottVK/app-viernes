import { Capacitor } from '@capacitor/core'

/** App empaquetada (APK) con Capacitor — no navegador web de escritorio. */
export const isApkRuntime = () =>
  typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()
