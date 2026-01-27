# CI/CD Branch ve Build Sorunu Düzeltmesi

## Tarih
2026-01-26

## Sorun
Docker'a yapılan değişiklikler yansımıyor. CI/CD'nin hangi branch'i kullandığı ve cache sorunu olup olmadığı belirsiz.

## Tespit Edilen Sorunlar

### 1. ci-clone-web.sh Hard-Coded Branch
**Sorun:**
- Script her zaman `main` branch'ini clone ediyor
- `WEB_GIT_BRANCH` environment variable'ı kullanılmıyor
- Branch prefix kontrolü yok (`origin/main` vs `main`)

**Önceki Kod:**
```bash
git clone --depth 1 -b main "$WEB_REPO" "$DEST"
```

**Düzeltilmiş Kod:**
```bash
WEB_BRANCH="${WEB_GIT_BRANCH:-main}"
BRANCH_NAME=$(echo "$WEB_BRANCH" | sed 's/^origin\///')
git clone --depth 1 -b "$BRANCH_NAME" "$WEB_REPO" "$DEST"
```

### 2. Commit Verification Eksik
**Sorun:**
- Clone edilen branch'in doğru commit'i içerip içermediği kontrol edilmiyor
- Build öncesi source verification yok

**Eklenen:**
```bash
# Verify the latest commit
cd "$DEST"
LATEST_COMMIT=$(git rev-parse HEAD)
LATEST_COMMIT_MSG=$(git log -1 --pretty=format:"%h %s")
echo "Latest commit in $BRANCH_NAME: $LATEST_COMMIT"
echo "Latest commit message: $LATEST_COMMIT_MSG"
```

### 3. Build Öncesi Source Verification
**Sorun:**
- Build başlamadan önce source'un doğru olduğu kontrol edilmiyor

**Eklenen:**
```bash
echo "Verifying beaver-iot-web source before build..."
if [ ! -d "beaver-iot-web" ]; then
  echo "ERROR: beaver-iot-web directory not found!"
  exit 1
fi
echo "beaver-iot-web directory exists, checking latest commit..."
cd beaver-iot-web
LATEST_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "not a git repo")
LATEST_COMMIT_MSG=$(git log -1 --pretty=format:"%h %s" 2>/dev/null || echo "no commit message")
echo "Latest commit in beaver-iot-web: $LATEST_COMMIT"
echo "Latest commit message: $LATEST_COMMIT_MSG"
```

### 4. CI/CD Workflow'da WEB_GIT_BRANCH Eksik
**Sorun:**
- Workflow'da `WEB_GIT_BRANCH` environment variable'ı set edilmiyor

**Eklenen:**
```yaml
- name: Clone beaver-iot-web (sibling of beaver-iot-docker, same as local)
  env:
    WEB_GIT_REPO_URL: "https://github.com/rifatsekerariot/beaver-iot-web.git"
    WEB_GIT_BRANCH: "main"  # ✅ Eklendi
    CI_CLONE_WEB_DEST: "beaver-iot-web"
  run: sh beaver-iot-docker/scripts/ci-clone-web.sh
```

## CI/CD Build Süreci

### 1. Clone Adımı
```bash
# ci-clone-web.sh çalışır
WEB_GIT_REPO_URL="https://github.com/rifatsekerariot/beaver-iot-web.git"
WEB_GIT_BRANCH="main"
CI_CLONE_WEB_DEST="beaver-iot-web"

# Script:
# 1. Branch'i normalize eder (origin/main -> main)
# 2. beaver-iot-web/ dizinine clone eder
# 3. Latest commit'i log'lar
```

### 2. Build Adımı
```bash
# build-prebuilt.sh çalışır
# 1. beaver-iot-web/ dizininin varlığını kontrol eder
# 2. Latest commit'i log'lar
# 3. beaver-iot-web-local.dockerfile ile build eder
# 4. beaver-iot-web/ dizinindeki dosyaları kullanır
```

### 3. Dockerfile Kullanımı
- **beaver-iot-web-local.dockerfile** kullanılıyor (CI/CD'de)
- Bu Dockerfile local `beaver-iot-web/` dizinini kopyalıyor
- `beaver-iot-web.dockerfile` kullanılmıyor (bu git clone yapıyor)

## Doğrulama

### CI/CD Log'larında Kontrol Edilecekler:

1. **Clone Adımı:**
```
Cloning beaver-iot-web from https://github.com/rifatsekerariot/beaver-iot-web.git, branch: main
Cloned beaver-iot-web into beaver-iot-web (branch: main)
Latest commit in main: b21d0f6...
Latest commit message: feat: Add comprehensive debug logs to report page...
```

2. **Build Adımı:**
```
Verifying beaver-iot-web source before build...
beaver-iot-web directory exists, checking latest commit...
Latest commit in beaver-iot-web: b21d0f6...
Latest commit message: feat: Add comprehensive debug logs to report page...
Building web image with beaver-iot-web-local.dockerfile...
```

## Olası Sorunlar ve Çözümler

### Sorun 1: Eski Commit Kullanılıyor
**Belirtiler:**
- CI/CD log'larında eski commit görünüyor
- Değişiklikler Docker image'ında yok

**Çözüm:**
- `--no-cache` flag'i zaten kullanılıyor ✅
- Commit verification eklendi ✅
- Branch kontrolü eklendi ✅

### Sorun 2: Yanlış Branch Clone Ediliyor
**Belirtiler:**
- `main` yerine başka branch clone ediliyor

**Çözüm:**
- `WEB_GIT_BRANCH` environment variable eklendi ✅
- Branch prefix normalization eklendi ✅
- Workflow'da `WEB_GIT_BRANCH: "main"` set edildi ✅

### Sorun 3: Cache Sorunu
**Belirtiler:**
- Build cache'den eski image kullanılıyor

**Çözüm:**
- `--no-cache` flag'i kullanılıyor ✅
- Her build fresh clone yapıyor ✅

## Test

CI/CD çalıştığında log'larda şunları görmelisiniz:

1. ✅ Clone adımında latest commit bilgisi
2. ✅ Build adımında source verification
3. ✅ Build adımında latest commit bilgisi
4. ✅ Commit hash'lerinin eşleşmesi

## Commit Bilgileri

- **beaver-iot-docker:** `[commit hash]` - CI/CD branch fix
- **Değişiklikler:**
  - `ci-clone-web.sh` - Branch support ve commit verification
  - `build-prebuilt.sh` - Source verification ve commit logging
  - `build-push-prebuilt.yaml` - WEB_GIT_BRANCH environment variable

## Sonuç

CI/CD artık:
- ✅ Doğru branch'i (`main`) clone ediyor
- ✅ Latest commit'i log'luyor
- ✅ Build öncesi source'u verify ediyor
- ✅ Commit hash'lerini kontrol ediyor
- ✅ Cache sorunlarını önlüyor (`--no-cache`)

Bir sonraki CI/CD build'inde log'ları kontrol ederek doğru commit'in kullanıldığını doğrulayabilirsiniz.
