# Tacna Móvil Rastreo

Proyecto Android nativo en Java, sin bibliotecas de ejecución adicionales. La
pantalla inicial solicita el permiso de ubicación precisa y abre los ajustes
del sistema si hace falta activar la ubicación.

Completa **Ruta** y **Placa o Nombre** y pulsa **Iniciar envío**. Android
minimiza la pantalla y mantiene el servicio de ubicación con una notificación.
Puedes abrir la app y pulsar **Guardar datos** para aplicar ambos campos juntos.
Puedes detener el envío desde la app o desde la notificación.

El servicio intenta enviar por HTTPS la última posición reciente cada cinco
segundos. Si se pierde la conexión, el siguiente envío usa la posición más
reciente disponible. La app guarda localmente los campos del formulario.

## Compilación

Abre esta carpeta como proyecto independiente en Android Studio o compílala
desde esta carpeta con JDK 17, Gradle 8.11.1, Android SDK 35 y Build Tools 35.0.0.
Configura `ANDROID_HOME` con la ruta del SDK.

```powershell
gradle :app:assembleDebug :app:lintDebug
(Get-Item .\app\build\outputs\apk\debug\app-debug.apk).Length
```

El segundo comando devuelve el tamaño del APK en bytes. El destino predeterminado
es `https://tacna-panel.glook.pro/api/rastreo`. Para compilar para otro despliegue,
pasa `-PrastreoEndpoint=https://tu-panel.example/api/rastreo` a Gradle.
