#!/bin/bash

# =================================================================
# Script para arreglar problemas de conexión en el servidor
# =================================================================

set -e

SERVER_IP="104.248.191.222"
SERVER_USER="root"
PROJECT_DIR="/root/qualifica-o-seu-professor"

echo "🔧 Arreglando problemas de configuración..."

ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "
    cd $PROJECT_DIR
    
    echo '📋 Estado actual de contenedores:'
    docker-compose ps
    
    echo ''
    echo '🛑 Deteniendo todos los contenedores...'
    docker-compose down
    
    echo ''
    echo '⚙️ Verificando archivos de configuración...'
    
    # Verificar que .env.db existe y tiene el contenido correcto
    if [ -f '.env.db' ]; then
        echo 'Archivo .env.db encontrado:'
        cat .env.db
    else
        echo 'Creando .env.db...'
        cat > .env.db << 'EOF'
MONGO_INITDB_ROOT_USERNAME=qualifica
MONGO_INITDB_ROOT_PASSWORD=qualifica
EOF
    fi
    
    echo ''
    echo '⚙️ Configurando .env para desarrollo local...'
    
    # Crear .env para desarrollo local (sin Docker para la app)
    cat > .env.local << 'EOF'
# App
PORT=3000
JWT_SECRET=super-secret-key-development
NODE_ENV=development

# Mongo (Docker container desde host)
MONGODB_URI=mongodb://qualifica:qualifica@localhost:27017/qualifica-professor?authSource=admin

# Seeder
SEED_RESET=true
SEED_USERS=50
SEED_UNIVERSITIES=30
SEED_PROFESSORS=100
SEED_STUDENTS=80
SEED_COMMENTS=200
SEED_ADMIN_PASSWORD=admin123
EOF

    # Actualizar .env principal para usar localhost cuando se ejecute fuera de Docker
    cat > .env << 'EOF'
# App
PORT=3000
JWT_SECRET=super-secret-key-production
NODE_ENV=production

# Mongo - usar localhost cuando se ejecute desde el host
MONGODB_URI=mongodb://qualifica:qualifica@localhost:27017/qualifica-professor?authSource=admin

# Seeder
SEED_RESET=true
SEED_USERS=50
SEED_UNIVERSITIES=30
SEED_PROFESSORS=100
SEED_STUDENTS=80
SEED_COMMENTS=200
SEED_ADMIN_PASSWORD=admin123
EOF

    echo ''
    echo '🐳 Iniciando solo MongoDB...'
    docker-compose up -d mongodb
    
    echo ''
    echo '⏳ Esperando a que MongoDB esté listo...'
    sleep 20
    
    # Verificar que MongoDB esté corriendo
    for i in {1..5}; do
        if docker-compose exec -T mongodb mongosh --eval 'db.adminCommand(\"ping\")' > /dev/null 2>&1; then
            echo '✅ MongoDB está listo!'
            break
        fi
        echo \"Intento \$i/5: MongoDB aún no está listo, esperando...\"
        sleep 10
    done
    
    echo ''
    echo '📦 Instalando dependencias...'
    npm install
    
    echo ''
    echo '🗃️ Compilando proyecto...'
    npm run build
    
    echo ''
    echo '🌱 Ejecutando seeder...'
    npm run seed
    
    echo ''
    echo '✅ Configuración completada!'
    echo ''
    echo '🚀 Para ejecutar en modo desarrollo:'
    echo '   npm run dev'
    echo ''
    echo '🐳 Para ejecutar con Docker:'
    echo '   docker-compose up -d'
    echo ''
    echo '📋 Ver logs de MongoDB:'
    echo '   docker-compose logs -f mongodb'
    echo ''
    echo '🔍 Verificar estado:'
    echo '   docker-compose ps'
    echo '   curl http://localhost:3000/api/health'
"

echo ""
echo "🎉 Arreglos aplicados!"
echo ""
echo "🔗 Ahora puedes conectarte al servidor y ejecutar:"
echo "   ssh root@$SERVER_IP"
echo "   cd /root/qualifica-o-seu-professor"
echo "   npm run dev"
echo ""
echo "🌐 La aplicación estará disponible en:"
echo "   http://$SERVER_IP:3000"