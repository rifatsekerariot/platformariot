# platformariot Repo Koruması — Sadece Sen Değiştir

Bu rehber, **rifatsekerariot/platformariot** reposunun silinmesini, değiştirilmesini ve başkalarının push atmasını engelleyip **sadece senin** değişiklik yapabilmeni sağlamak için GitHub ayarlarında yapman gereken adımları özetler.

---

## 0. Otomatik: `main` branch protection (tek komut)

Repo kökünden:

```powershell
$env:GH_TOKEN = "ghp_XXXXXXXX"; .\scripts\github-protect-main.ps1
```

- **Token:** [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) → Generate new token (classic) → `repo` (veya `admin:repo`) işaretle.
- Script `main` için force-push ve dal silmeyi kapatır, `enforce_admins` açılır.

Token yoksa script hata verip bu adımları hatırlatır.

---

## 1. Başkalarının Repo’ya Yazmasını Kapat

**GitHub → Repo → Settings → Collaborators and teams** (veya **Collaborators**)

- **Hiç kimseyi “Write” veya “Admin” olarak ekleme.**  
  Sadece “Read” istiyorsan ekleyebilirsin; o kişiler yine de push yapamaz.
- Zaten **Write/Admin** verdiğin biri varsa → **Remove** veya iznini **Read** yap.

Böylece sadece **repo owner** (sen) push yapabilir.

---

## 2. `main` Dalını Korumaya Al (Silme / Force-Push Engel)

**GitHub → Repo → Settings → Branches → Add branch protection rule**

- **Branch name pattern:** `main`
- Aç:

  | Ayar | Öneri |
  |------|--------|
  | **Require a pull request before merging** | İstersen aç (kendi PR’larını kendin merge edersin). “Sadece ben değiştireyim” için zorunlu değil. |
  | **Require status checks to pass before merging** | CI (Build) kullanıyorsan açıp `build-push-prebuilt` vs. ekleyebilirsin. |
  | **Do not allow bypassing the above settings** | **Aç.** Admin bile kurallara uyar; yalnız sen değiştirirsin. |
  | **Restrict who can push to matching branches** | Kişi/ekip kısıtı **organization** reposunda var. Kişisel repoda yoksa bu adımı atla. |
  | **Allow force pushes** | **Kapalı.** Kimse `--force` push atamasın. |
  | **Allow deletion** | **Kapalı.** `main` silinemesin. |

- **Create** / **Save changes** ile kuralı kaydet.

---

## 3. Repo’nun Silinmesini Zorlaştır

- GitHub’da **repo silme** sadece **Admin/Owner** yetkisi olanlar yapabilir.
- **Settings → Danger Zone → Delete this repository** sadece owner’a açık.
- **Başkalarının silmesini engellemek** = kimseye Admin vermemek.  
  Buna **1. adım** (Collaborators’ta Write/Admin yok) ile ulaşıyorsun.

İstersen ek güvenlik için:

- GitHub hesabında **2FA (two-factor authentication)** aç.
- **Settings → Password and authentication → Two-factor authentication** → **Enable**.

---

## 4. CODEOWNERS (Opsiyonel)

Repo’da `.github/CODEOWNERS` var; tüm dosyalar `@rifatsekerariot` olarak işaretli. Bu:

- PR’larda bu kullanıcıyı otomatik review atar.
- “Değişiklikleri onaylayan sensin” mesajını netleştirir.

“Sadece ben değiştireyim” için zorunlu değil; izinleri **1–2. adımlar** belirler.

---

## 5. Özet Kontrol Listesi

| Yapı | Nasıl sağlanır |
|------|-----------------|
| Başkaları push atamasın | Collaborators’ta kimseye Write/Admin verme. |
| `main` silinmesin / force-push olmasın | Branch protection: force push ve deletion **kapalı**. |
| Repo silinmesin | Sadece sen Admin/Owner ol; 2FA aç. |
| Değişiklikleri sadece sen yap | Yukarıdakiler yeterli (sadece sen push atabiliyorsun). |

---

## 6. Organization Kullanıyorsan

Repo bir **organization** altındaysa:

- **Settings → Collaborators and teams** → ekipleri / rolleri kontrol et.
- **Restrict who can push to matching branches** ile sadece kendini (veya güvendiğin tek kişiyi) ekleyebilirsin.

---

*Bu dosya yalnızca rehber amaçlıdır; GitHub arayüzü zamanla değişebilir. Güncel makaleler: [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [Managing collaborators](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-your-profile/managing-contributors-on-your-profile).*
