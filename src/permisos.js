import { PushNotifications } from '@capacitor/push-notifications'
import { Filesystem } from '@capacitor/filesystem'

export const solicitarPermisos = async () => {
  try {
    const notif = await PushNotifications.requestPermissions()
    console.log('Notificaciones:', notif.receive)
    
    const files = await Filesystem.requestPermissions()
    console.log('Almacenamiento:', files.publicStorage)
  } catch (e) {
    console.log('Permisos error:', e)
  }
}