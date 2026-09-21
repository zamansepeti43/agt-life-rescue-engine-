# AGT Life Rescue Engine

**Hayat Kurtarma Motoru** — günlük hayattaki karmaşık problemleri takip etmek yerine çözüm adımlarına dönüştüren ürün.

## Koruma kuralı

Bu depo, `zamansepeti43/atlas-decision-engine` projesinden izole edilmiş bir geliştirme kopyasıdır. **Atlas'ın orijinal deposuna bu projeden commit gönderilmez.**

## İlk sürüm

- Problem metni alma
- Problem kategorisini otomatik belirleme
- Hedefi otomatik belirleme
- Aciliyet analizi
- Teşhis
- Öncelikli eylem adımları
- Sonraki kritik soruyu üretme
- Türkçe web arayüzü
- API: `POST /api/life-rescue/analyze`
- Arayüz: `/life-rescue`

## Ürün yaklaşımı

Life Rescue Engine bir planner (planlayıcı) veya tracker (takip aracı) olmaktan ziyade **problem → teşhis → öncelik → eylem** akışını hedefler.

İlk ürün ailesi:

- Life Rescue Engine — Hayat Kurtarma Motoru
- Money Rescue Engine — Para Kurtarma Motoru
- Family Rescue Engine — Aile Kurtarma Motoru
- Small Business Rescue Engine — Küçük İşletme Kurtarma Motoru

## Sonraki geliştirmeler

1. Kullanıcı hafızası ve kişisel kısıtlar
2. Tekrarlayan sorunlar için kurtarma senaryoları
3. Maliyet azaltma ve zaman kazanma hesaplayıcıları
4. Yapılacaklar listesine dönüşen eylem planı
5. AI destekli serbest metin analizi
6. Offline (çevrimdışı) temel motor
7. Windows/Android paketleme
