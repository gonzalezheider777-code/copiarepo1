# UniConnect - Guía de Deployment

## Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase configurada
- Variables de entorno configuradas

## Variables de Entorno

Asegúrate de que tu archivo `.env` contenga:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Build de Producción

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar build:
```bash
npm run build
```

3. Previsualizar build (opcional):
```bash
npm run preview
```

## Deployment en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Vercel detectará automáticamente Vite y hará el build

## Deployment en Netlify

1. Conecta tu repositorio a Netlify
2. Configura build command: `npm run build`
3. Configura publish directory: `dist`
4. Agrega variables de entorno en el dashboard

## Configuración de Supabase

### 1. Aplicar Migraciones

Todas las migraciones en `supabase/migrations/` deben aplicarse en orden:

```
001_create_auth_tables.sql
002_create_social_tables.sql
003_create_notifications_tables.sql
004_create_storage_buckets.sql
005_create_messaging_tables.sql
006_create_groups_tables.sql
```

### 2. Configurar Storage Buckets

Crear los siguientes buckets en Supabase Storage:

- `avatars` - Para fotos de perfil (público)
- `covers` - Para fotos de portada (público)
- `posts` - Para imágenes de posts (público)
- `messages` - Para archivos compartidos en mensajes (privado)

### 3. Configurar Políticas de Seguridad

Todas las políticas RLS están incluidas en las migraciones. Verificar que estén activas:

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

## Optimizaciones Post-Deployment

### 1. CDN y Cache

- Configurar CDN para archivos estáticos
- Habilitar cache de 1 año para assets con hash
- Configurar cache de 5 minutos para HTML

### 2. Monitoreo

- Configurar Sentry o similar para error tracking
- Implementar analytics (Google Analytics, Plausible, etc.)
- Monitorear métricas de Supabase (queries, storage)

### 3. Performance

- Verificar Core Web Vitals con Lighthouse
- Optimizar imágenes con servicios de CDN (Cloudinary, imgix)
- Implementar lazy loading en todas las imágenes

## Backup y Recuperación

### Base de Datos

Configurar backups automáticos en Supabase:
- Daily backups habilitados
- Point-in-time recovery (PITR) recomendado para producción

### Storage

Configurar backups de buckets:
```bash
supabase storage download --recursive --bucket avatars
```

## Checklist Pre-Launch

- [ ] Todas las migraciones aplicadas
- [ ] Variables de entorno configuradas
- [ ] Storage buckets creados y configurados
- [ ] RLS policies activas en todas las tablas
- [ ] Build de producción exitoso
- [ ] Testing en ambiente de staging
- [ ] Configuración de dominio y SSL
- [ ] Analytics configurado
- [ ] Error monitoring activo
- [ ] Backups configurados
- [ ] Documentación actualizada

## Troubleshooting

### Error: "Failed to fetch"

- Verificar que las URLs de Supabase sean correctas
- Verificar CORS en Supabase dashboard
- Verificar que las policies RLS permitan acceso

### Error: "Storage bucket not found"

- Crear buckets manualmente en Supabase
- Verificar permisos de buckets (público/privado)

### Error: Build fallido

- Limpiar node_modules y reinstalar: `rm -rf node_modules && npm install`
- Verificar versión de Node.js: `node --version`
- Verificar errores de TypeScript: `npm run lint`

## Monitoreo Post-Launch

### Métricas Clave

- Tiempo de carga inicial (LCP < 2.5s)
- First Input Delay (FID < 100ms)
- Cumulative Layout Shift (CLS < 0.1)
- Tasa de error < 1%
- Uptime > 99.9%

### Logs Importantes

- Errores de autenticación
- Fallos en uploads de archivos
- Queries lentas (> 1s)
- Rate limiting activado
- Intentos de acceso no autorizados

## Actualizaciones

### Proceso Recomendado

1. Crear rama de feature
2. Desarrollar y testear localmente
3. Merge a staging
4. Testing en staging
5. Merge a main/production
6. Monitorear logs post-deployment

### Rolling Back

Si es necesario revertir:
```bash
git revert HEAD
git push origin main
```

Vercel/Netlify automáticamente hará redeploy de la versión anterior.

## Soporte

Para issues técnicos:
- Revisar logs en Supabase dashboard
- Revisar logs en Vercel/Netlify
- Revisar error tracking (Sentry)
- Contactar soporte de Supabase si es necesario
