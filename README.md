# AGT Life Rescue Engine

**Hayat Kurtarma Motoru** — günlük hayattaki karmaşık problemleri takip etmek yerine çözüm adımlarına dönüştüren, Türkçe ve offline-first çalışan kişisel problem çözme ürünü.

## Koruma kuralı

Bu depo, `zamansepeti43/atlas-decision-engine` projesinden izole edilmiş bir geliştirme kopyasıdır. **Atlas'ın orijinal deposuna bu projeden commit gönderilmez.**

## V1 özellikleri

- Problem → teşhis → öncelik → eylem akışı
- Doğal Türkçe konuşma arayüzü
- Para, fatura, zaman, karar, aile ve iş senaryoları
- Kategori ve hedef otomatik belirleme
- Aciliyet, bütçe, zaman ve metindeki parasal tutarları kısıt olarak çıkarma
- Kararın hangi bilgilere dayandığını gösterme
- Aşama takibi: anlama → stabilize etme → önceliklendirme → eylem
- Somut **Kurtarma Planı**
- Planı İZCİ görevlerine aktarma
- API erişilemezse cihaz üzerinde çalışan offline karar motoru
- İZCİ görevleri, hatırlatıcılar, hedefler, abonelikler ve fiyat takipleri
- Tek seferlik / günlük / haftalık / aylık Android bildirimleri
- Cihaz yeniden başlatıldığında bildirimlerin geri yüklenmesi
- Android APK içine web uygulamasının gömülmesi
- Native Android bildirimleri sayesinde APK için Vercel Cron veya sürekli internet gerekmemesi

## Android APK

Android katmanı:

**Web UI → AndroidLocalNotifications → AlarmManager → NotificationReceiver**

şeklinde çalışır.

APK üretiminde GitHub Actions workflow'u `.github/workflows/android-apk.yml` üzerinden otomatik olarak debug APK oluşturur ve artifact olarak yükler.

Yerel derleme:

```bash
pnpm install --frozen-lockfile
pnpm --dir artifacts/atlas-ai build
gradle -p android assembleDebug --no-daemon
```

APK çıktısı:

`android/app/build/outputs/apk/debug/app-debug.apk`

## API

Life Rescue analizi:

`POST /api/life-rescue/analyze`

Web sürümünde API kullanılır. API erişilemediğinde temel analiz otomatik olarak offline motora düşer.

## Ürün ailesi

- Life Rescue Engine — Hayat Kurtarma Motoru
- Money Rescue Engine — Para Kurtarma Motoru
- Family Rescue Engine — Aile Kurtarma Motoru
- Small Business Rescue Engine — Küçük İşletme Kurtarma Motoru

## Tasarım ilkesi

Life Rescue bir planner (planlayıcı), tracker (takip aracı) veya sıradan chatbot değildir.

Ana hedef:

**Problem → Teşhis → Öncelik → Eylem → Takip**

Kullanıcıya sadece öneri vermek yerine, problemi çözmeye götüren uygulanabilir bir sonraki adımı üretmek.

## Korunan proje

Orijinal Atlas:

`zamansepeti43/atlas-decision-engine`

Bu repo ondan bağımsız geliştirilir; Atlas'ın orijinal kod tabanına dokunulmaz.
