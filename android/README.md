# AGT Life Rescue — Android

Bu klasör Life Rescue / İZCİ arayüzünü **Android APK içine gömer**.

## Bildirim mimarisi

Android APK'da zamanlanmış görev ve hatırlatıcılar:

**Web UI → AndroidLocalNotifications → AlarmManager → NotificationReceiver → Android bildirimi**

şeklinde çalışır.

APK içindeki temel İZCİ görev/hatırlatıcı bildirimleri için **Vercel Cron, Web Push veya sürekli internet bağlantısı gerekmez.**

Cihaz yeniden başlatılırsa kaydedilmiş yerel bildirimler BootReceiver tarafından yeniden planlanır.

## APK

Web uygulamasını üret:

    pnpm --dir artifacts/atlas-ai build

Sonra:

    cd android
    ./gradlew assembleDebug

Windows:

    cd android
    gradlew.bat assembleDebug

Çıktı: android/app/build/outputs/apk/debug/app-debug.apk

Android 13 ve üzeri cihazlarda ilk açılışta bildirim izni istenir.

## Önemli

Web/PWA sürümünde mevcut Web Push kodu hâlâ kullanılabilir. Native Android ortamında önce native bildirim köprüsü denenir; böylece APK Vercel bildirim kuyruğuna bağımlı kalmaz.

Atlas'ın orijinal deposuna dokunulmaz. Bu katman yalnızca agt-life-rescue-engine- içindedir.