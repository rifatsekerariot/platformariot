# Alarm Widget Görünürlük Kontrol Raporu

## Sonuç

**Alarm widget kodda var** ancak **arayüzde görünmüyor** — "Add widget" listesinden **bilinçli olarak filtreleniyor**.

---

## 1. Alarm Widget Gerçekten Var mı?

**Evet.** Tam teşekküllü bir plugin olarak mevcut:

| Bileşen | Konum |
|--------|--------|
| Control panel | `plugins/alarm/control-panel/index.ts` |
| View | `plugins/alarm/view/index.tsx` |
| Config | `type: 'alarm'`, `name: 'dashboard.plugin_name_alarm'`, `class: 'data_card'` |
| İkon | `Alarm.svg` |
| AlarmTimeSelect | `components/alarm-time-select` |
| API | `deviceAPI.getDeviceAlarms`, `claimDeviceAlarm`, `exportDeviceAlarms` |

Map ve device-list widget’ları da alarm ile aynı şekilde **filtre dışı bırakılmış** durumda.

---

## 2. Neden Arayüzde Görünmüyor?

**Sebep:** `useFilterPlugins` hook’u, "Add widget" listesini oluştururken **alarm**, **map** ve **deviceList** plugin’lerini **her zaman** çıkarıyor.

**Dosya:** `apps/web/src/components/drawing-board/hooks/useFilterPlugins.tsx`

```ts
return pluginsControlPanel.filter(
    p => !(['deviceList', 'alarm', 'map'] as PluginType[]).includes(p.type),
);
```

- **PluginList** (dashboard ana plugin grid’i): `useFilterPlugins()` kullanıyor → alarm/map/deviceList **gösterilmiyor**.
- **PluginListPopover** ("+ Add widget" açılır menüsü): `useFilterPlugins(deviceDetail)` kullanıyor → aynı filtre, yine **gösterilmiyor**.

Bu filtre hem **Dashboard** hem **Device Canvas** (cihaz detayı) için geçerli. Yani alarm widget’ı hiçbir "Add widget" akışında listelenmiyor.

---

## 3. Özet

| Soru | Cevap |
|------|--------|
| Alarm widget var mı? | **Evet**, plugin olarak mevcut. |
| Arayüzde neden yok? | **useFilterPlugins** ile listelenen plugin’lerden çıkarılıyor. |
| Sadece kodda mı? | Hayır; **eklenebilir** bir widget olarak tanımlı, sadece "Add widget" listesine **alınmıyor**. |

---

## 4. Alarm’ı Görünür Yapmak İçin

`useFilterPlugins` içindeki filtreyi güncellemek yeterli. Örneğin yalnızca **alarm**’ı göstermek için `alarm` tipi filtreden çıkarılmalı; **map** ve **deviceList** aynı kalabilir veya isteğe göre onlar da eklenebilir.

Bu değişiklik yapıldığında alarm widget’ı "Add widget" listesinde görünür ve dashboard’a eklenebilir.
