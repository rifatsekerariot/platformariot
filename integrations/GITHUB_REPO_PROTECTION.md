# GitHub Repo Koruma Rehberi

Bu dokümanda **rifatsekerariot** Beaver IoT repolarını korumak için önerilen ayarlar ve adımlar yer alıyor. Repolar geliştirilebilir kalacak; yanlışlıkla force-push, doğrudan `main` üzerine push veya silme engellenecek.

---

## 1. Bu repoda eklenen dosyalar (zaten commit’lendi)

- **SECURITY.md** — Güvenlik açığı bildirimi (GitHub Security Advisories).
- **.github/dependabot.yml** — Maven bağımlılık güncellemeleri ve güvenlik uyarıları.
- **.github/PULL_REQUEST_TEMPLATE.md** — PR açılınca otomatik doldurulan şablon.
- **CODEOWNERS** — Kod sahipliği (ör. `@rifatsekerariot`).

---

## 2. GitHub’da uygulamanız gerekenler

### 2.0 Script ile uygulama (önerilen)

**GITHUB_TOKEN** (Fine-grained PAT, bu repolarda **Administration** = Read and write) ile branch protection API üzerinden uygulanabilir:

```powershell
cd c:\Projeler\beaver\scripts
$env:GITHUB_TOKEN = "ghp_..."   # veya fine-grained token
.\apply-github-protection.ps1
```

Token: **GitHub → Settings → Developer settings → Personal access tokens** (Fine-grained) → ilgili repolara **Administration** yetkisi verin.

### 2.1 Branch protection (`main`) — UI ile

Her korumak istediğiniz repo için:

1. **GitHub** → repoya git (örn. [beaver-iot-integrations](https://github.com/rifatsekerariot/beaver-iot-integrations)).
2. **Settings** → **Branches**.
3. **Add branch protection rule** (veya **Add rule**).
4. **Branch name pattern:** `main`.
5. Aşağıdakileri işaretleyin:
   - **Require a pull request before merging**
     - İsterseniz **Require approvals** = 1 (tek kişiyseniz 0 da bırakılabilir).
   - **Do not allow bypassing the above settings** (varsa).
   - **Restrict who can push to matching branches** kullanmıyorsanız, herkes PR ile merge edebilir; doğrudan push engellenir.
6. **Allow force pushes:** Kapalı.
7. **Allow deletion:** Kapalı.
8. **Create** / **Save changes**.

Böylece `main`’e doğrudan `git push` yerine **Pull Request** zorunlu olur; force-push ve branch silme kapatılmış olur.

### 2.2 Dependabot

- **Settings** → **Code security and analysis**.
- **Dependabot alerts**: **Enable** (açık olsun).
- **Dependabot security updates**: İsterseniz **Enable**.
- `.github/dependabot.yml` repoda olduğu için Dependabot otomatik çalışır; haftalık PR’lar oluşturur.
- `dependabot.yml` içinde `labels: - "dependencies"` varsa, repoda **dependencies** label’i tanımlı olmalı (Issues → Labels → New). Yoksa Dependabot PR’larda “labels could not be found” uyarısı yazar.

### 2.3 Güvenlik

- **Settings** → **Code security and analysis** → **Private vulnerability reporting**: İsterseniz **Enable** (SECURITY.md ile uyumlu).

---

## 3. Hangi repolara uygulanacak?

| Repo | Link | Branch protection | Dependabot | SECURITY / CODEOWNERS / PR template |
|------|------|-------------------|------------|-------------------------------------|
| **beaver-iot-integrations** | https://github.com/rifatsekerariot/beaver-iot-integrations | ✅ `main` | ✅ (Maven) | ✅ Bu repoda mevcut |
| **beaver-iot-docker** | https://github.com/rifatsekerariot/beaver-iot-docker | ✅ `main` | ✅ (Docker, Actions) | ✅ O repoda mevcut |
| **beaver-iot-web** | https://github.com/rifatsekerariot/beaver-iot-web | ✅ `main` | İsteğe bağlı | Zaten PR template vs. var |
| **beaver-iot-blueprint** | https://github.com/rifatsekerariot/beaver-iot-blueprint | ✅ `main` | İsteğe bağlı | İsteğe bağlı eklenebilir |

---

## 4. Geliştirme akışı (koruma sonrası)

- `main`’e doğrudan push **yok**.
- Yeni değişiklikler: **branch aç** → **commit** → **push** → **Pull Request** aç → **Merge**.
- Force-push ve `main` silme kapalı olduğu için repolar korunur; geliştirme PR ile sürer.

---

## 5. Özet

- Repo içine **SECURITY.md**, **dependabot**, **PR template**, **CODEOWNERS** eklendi.
- **GitHub UI’dan** her repo için **branch protection** (`main`) ve **Dependabot** ayarlarını yukarıdaki gibi açmanız yeterli.

Bu adımlarla repolar hem korunur hem de PR tabanlı geliştirmeye uygun kalır.
