---

## Trivy: cómo ejecutarlo por CLI (Windows cmd) y en CI

Puedes ejecutar Trivy de dos formas: con Docker (sin instalar nada) o instalándolo nativamente. Abre "cmd" (no PowerShell) en la carpeta del proyecto.

- Opción A: usando Docker (recomendado)
1) Escanear el repositorio (vulnerabilidades, misconfiguraciones y secretos):

```cmd
docker pull aquasec/trivy:latest
docker run --rm -v "%cd%:/repo" aquasec/trivy:latest fs --scanners vuln,misconfig,secret --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 /repo
```
2) Guardar resultados en SARIF (útil para GitHub Security):

```cmd
docker run --rm -v "%cd%:/repo" -v "%cd%\trivy-cache:/root/.cache/trivy" aquasec/trivy:latest fs --format sarif --output /repo/trivy-fs.sarif /repo
```
3) Escanear una imagen (por ejemplo SonarQube y Node 20):

```cmd
docker run --rm -v "%cd%\trivy-cache:/root/.cache/trivy" aquasec/trivy:latest image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 sonarqube:latest
docker run --rm -v "%cd%\trivy-cache:/root/.cache/trivy" aquasec/trivy:latest image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 node:20
```
4) Escanear tu propia imagen local (si tienes un Dockerfile):

```cmd
docker build -t myapp:local .
docker run --rm -v "%cd%\trivy-cache:/root/.cache/trivy" aquasec/trivy:latest image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 myapp:local
```

- Opción B: instalación nativa con Chocolatey
1) Instalar Trivy:

```cmd
choco install trivy -y
```
2) Escanear el repo e imágenes:

```cmd
trivy fs --scanners vuln,misconfig,secret --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 .
trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 sonarqube:latest
trivy image --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 node:20
```

Notas:
- El primer escaneo descarga la base de datos de vulnerabilidades; puede tardar. Puedes cachear con `-v "%cd%\trivy-cache:/root/.cache/trivy"` (Docker) o dejar que Trivy use su cache local (nativo).
- Para reportes alternativos: `--format table|json|sarif|template --output <archivo>`.
- Para fallar el proceso cuando haya HIGH/CRITICAL: `--exit-code 1 --severity HIGH,CRITICAL`.
- Si estás detrás de un proxy en cmd.exe: `set HTTP_PROXY=http://usuario:pass@host:puerto` y `set HTTPS_PROXY=...` antes de ejecutar Trivy.

### Atención (Windows): rutas en -v según tu shell
- cmd.exe (símbolo del sistema): usa `%cd%` y comillas dobles.

```cmd
docker run --rm -v "%cd%:/repo" aquasec/trivy:latest fs /repo
```

- PowerShell: usa `${PWD}` (o `${PWD}.Path`).

```powershell
docker run --rm -v "${PWD}:/repo" aquasec/trivy:latest fs /repo
# Si necesitas el path como string puro: "${PWD}.Path"
docker run --rm -v "${PWD}.Path:/repo" aquasec/trivy:latest fs /repo
```

- Git Bash (MINGW64): usa `$(pwd -W)` para obtener la ruta estilo Windows. Ideal cuando hay espacios en la ruta.

```bash
docker run --rm -v "$(pwd -W):/repo" aquasec/trivy:latest fs /repo
```

Si ves el error `"%cd%" includes invalid characters for a local volume name`, significa que tu shell no expandió `%cd%`. Usa la variante correcta para tu shell o pasa una ruta absoluta entre comillas, por ejemplo:

```bash
# Git Bash (ruta absoluta con espacios)
docker run --rm -v "/c/Users/tuUsuario/Downloads/COMPUNET III/sonarqube/SonarQube-and-trivy-lab:/repo" aquasec/trivy:latest fs /repo
```

### CI en GitHub Actions
Se añadió un workflow en `.github/workflows/trivy.yml` que:
- Escanea el repositorio (FS) con Trivy (vulnerabilidades, misconfiguraciones y secretos) y sube resultados SARIF al Security tab.
- Escanea imágenes `sonarqube:latest` y `node:20` en un job en matriz, también subiendo SARIF.
- El workflow corre en cada push y pull request.
