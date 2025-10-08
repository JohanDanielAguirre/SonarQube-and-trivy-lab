#!/bin/bash

# =================================================================
# Script de despliegue para qualifica-o-seu-professor
# Servidor: 104.248.191.222
# =================================================================

set -e  # Exit on any error

echo "🚀 Iniciando despliegue del proyecto qualifica-o-seu-professor..."

# Variables
SERVER_IP="104.248.191.222"
SERVER_USER="root"
PROJECT_NAME="qualifica-o-seu-professor"
PROJECT_DIR="/root/$PROJECT_NAME"
REPO_URL="https://github.com/JohanDanielAguirre/qualifica-o-seu-professor.git"
BRANCH="Express"

# Función para ejecutar comandos en el servidor
run_remote() {
    ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# Función para copiar archivos al servidor
copy_to_server() {
    scp -o StrictHostKeyChecking=no -r "$1" $SERVER_USER@$SERVER_IP:"$2"
}

echo "📋 Conectando al servidor $SERVER_IP..."

# 1. Actualizar el sistema y instalar dependencias básicas
echo "🔧 Actualizando sistema e instalando dependencias..."
run_remote "
    export DEBIAN_FRONTEND=noninteractive &&
    apt-get update -y &&
    apt-get upgrade -y &&
    apt-get install -y curl wget git build-essential
"

# 2. Instalar Docker si no está instalado
echo "🐳 Verificando e instalando Docker..."
run_remote "
    if ! command -v docker &> /dev/null; then
        echo 'Instalando Docker...'
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
        rm get-docker.sh
    else
        echo 'Docker ya está instalado'
    fi
"

# 3. Instalar Docker Compose si no está instalado
echo "🐳 Verificando e instalando Docker Compose..."
run_remote "
    if ! command -v docker-compose &> /dev/null; then
        echo 'Instalando Docker Compose...'
        curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    else
        echo 'Docker Compose ya está instalado'
    fi
"

# 4. Instalar Node.js (usando NodeSource)
echo "📦 Instalando Node.js..."
run_remote "
    if ! command -v node &> /dev/null; then
        echo 'Instalando Node.js...'
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        echo 'Node.js ya está instalado: $(node --version)'
    fi
"

# 5. Clonar o actualizar el repositorio
echo "📥 Clonando/actualizando el repositorio desde la rama $BRANCH..."
run_remote "
    if [ -d '$PROJECT_DIR' ]; then
        echo 'Actualizando repositorio existente...'
        cd $PROJECT_DIR
        git fetch origin
        git checkout $BRANCH || git checkout -b $BRANCH origin/$BRANCH
        git reset --hard origin/$BRANCH
        git pull origin $BRANCH
        echo 'Repositorio actualizado a la rama $BRANCH'
    else
        echo 'Clonando repositorio desde la rama $BRANCH...'
        git clone -b $BRANCH $REPO_URL $PROJECT_DIR
        cd $PROJECT_DIR
        git checkout $BRANCH
        echo 'Repositorio clonado desde la rama $BRANCH'
    fi
"

# 6. Crear archivos de configuración
echo "⚙️ Configurando archivos de entorno..."
run_remote "
    cd $PROJECT_DIR
    
    # Crear .env principal
    cat > .env << 'EOF'
# App
PORT=3000
JWT_SECRET=super-secret-key-production-$(date +%s)

# Mongo (Docker)
MONGODB_URI=mongodb://qualifica:qualifica@mongodb:27017/qualifica-professor?authSource=admin

# Seeder
SEED_RESET=true
SEED_USERS=50
SEED_UNIVERSITIES=30
SEED_PROFESSORS=100
SEED_STUDENTS=80
SEED_COMMENTS=200
SEED_ADMIN_PASSWORD=admin123
EOF

    # Crear .env.db para MongoDB
    cat > .env.db << 'EOF'
MONGO_INITDB_ROOT_USERNAME=qualifica
MONGO_INITDB_ROOT_PASSWORD=qualifica
EOF
"

# 7. Crear Dockerfile para la aplicación si no existe
echo "🐳 Creando Dockerfile para la aplicación..."
run_remote "
    cd $PROJECT_DIR
    if [ ! -f 'Dockerfile' ]; then
        cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD [\"npm\", \"start\"]
EOF
    fi
"

# 8. Actualizar docker-compose.yml para incluir la aplicación
echo "🐳 Actualizando docker-compose.yml..."
run_remote "
    cd $PROJECT_DIR
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: qualifica-mongodb
    hostname: mongodb
    restart: unless-stopped
    volumes:
      - mongodb-data:/data/db
      - mongodb-log:/var/log/mongodb
    env_file:
      - .env.db
    environment:
      MONGO_INITDB_ROOT_USERNAME: \${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_INITDB_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: qualifica-professor
    ports:
      - \"27017:27017\"
    networks:
      - qualifica-network
    healthcheck:
      test: [\"CMD\", \"mongosh\", \"--eval\", \"db.adminCommand('ping')\"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  app:
    build: .
    container_name: qualifica-app
    hostname: app
    restart: unless-stopped
    ports:
      - \"3000:3000\"
      - \"0.0.0.0:3000:3000\"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - qualifica-network
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  mongodb-data:
    driver: local
    name: mongodb-data
  mongodb-log:
    driver: local
    name: mongodb-log

networks:
  qualifica-network:
    driver: bridge
    name: qualifica-network
EOF
"

# 9. Instalar dependencias de Node.js localmente (para el seeder)
echo "📦 Instalando dependencias de Node.js..."
run_remote "
    cd $PROJECT_DIR
    npm install
"

# 10. Detener contenedores existentes y construir nuevos
echo "🐳 Construyendo y levantando contenedores..."
run_remote "
    cd $PROJECT_DIR
    docker-compose down --remove-orphans || true
    docker-compose build --no-cache
    docker-compose up -d
"

# 11. Esperar a que MongoDB esté listo
echo "⏳ Esperando a que MongoDB esté listo..."
run_remote "
    cd $PROJECT_DIR
    echo 'Esperando a que MongoDB inicie...'
    sleep 30
    
    # Verificar que MongoDB esté corriendo
    for i in {1..10}; do
        if docker-compose exec -T mongodb mongosh --eval 'db.adminCommand(\"ping\")' > /dev/null 2>&1; then
            echo 'MongoDB está listo!'
            break
        fi
        echo \"Intento \$i/10: MongoDB aún no está listo, esperando...\"
        sleep 10
    done
"

# 12. Ejecutar el seeder
echo "🌱 Ejecutando seeder..."
run_remote "
    cd $PROJECT_DIR
    echo 'Ejecutando npm run seed...'
    npm run seed || echo 'Seeder falló, continuando...'
"

# 13. Reiniciar la aplicación para asegurar que use los datos seedeados
echo "🔄 Reiniciando aplicación..."
run_remote "
    cd $PROJECT_DIR
    docker-compose restart app
    sleep 10
"

# 14. Verificar que todo esté funcionando
echo "✅ Verificando servicios..."
run_remote "
    cd $PROJECT_DIR
    echo '=== Estado de los contenedores ==='
    docker-compose ps
    
    echo -e '\n=== Logs de la aplicación (últimas 20 líneas) ==='
    docker-compose logs --tail=20 app
    
    echo -e '\n=== Verificando conectividad ==='
    curl -f http://localhost:3000/api/health || echo 'Endpoint de salud no disponible'
    
    echo -e '\n=== Puertos abiertos ==='
    netstat -tlnp | grep :3000 || echo 'Puerto 3000 no visible en netstat'
"

# 15. Configurar firewall si es necesario
echo "🔥 Configurando firewall..."
run_remote "
    # Permitir puerto 3000
    ufw allow 3000/tcp || echo 'UFW no está instalado o ya configurado'
    
    # Mostrar reglas del firewall
    ufw status || echo 'UFW no está activo'
"

echo "🎉 ¡Despliegue completado!"
echo ""
echo "🌐 Tu aplicación debería estar disponible en:"
echo "   http://$SERVER_IP:3000"
echo ""
echo "📊 Para monitorear la aplicación:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo "   cd $PROJECT_DIR"
echo "   docker-compose logs -f app"
echo ""
echo "🔧 Comandos útiles en el servidor:"
echo "   docker-compose ps              # Ver estado de contenedores"
echo "   docker-compose logs app        # Ver logs de la aplicación"
echo "   docker-compose restart app     # Reiniciar aplicación"
echo "   docker-compose down            # Detener todo"
echo "   docker-compose up -d           # Levantar servicios"
echo ""

# Test final desde local
echo "🧪 Probando conectividad desde local..."
if curl -f --connect-timeout 10 http://$SERVER_IP:3000/api/health &>/dev/null; then
    echo "✅ ¡Aplicación accesible desde el exterior!"
else
    echo "⚠️  La aplicación puede no estar accesible desde el exterior aún."
    echo "   Verifica los logs del servidor y el firewall."
fi

echo ""
echo "✨ Script completado. ¡Tu aplicación debería estar corriendo!"