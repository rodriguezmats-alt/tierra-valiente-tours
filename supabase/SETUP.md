# Configurar reseñas compartidas

Las reseñas se guardan en Supabase. Las personas visitantes pueden enviar reseñas, pero solo las aprobadas manualmente aparecen en la página.

1. Abre el proyecto en [Supabase](https://supabase.com/).
2. En **SQL Editor**, ejecuta el contenido actualizado de `schema.sql`. Si la tabla ya existía, las filas anteriores quedarán como `pending` y no se mostrarán hasta que las revises.
3. En **Project Settings → API**, copia la **Project URL** y la clave pública **anon / publishable**.
4. Sustituye el valor de ejemplo `anonKey` en `supabase-config.js` por la clave pública de ese proyecto. La URL ya está rellenada con el proyecto configurado en este repositorio.
5. Publica los archivos del sitio con conexión a internet; la página carga `supabase-js` desde jsDelivr.

## Revisar y aprobar reseñas

En **Table Editor → reviews**, revisa las filas con `status = pending`. Cambia `status` a `approved` para mostrarlas públicamente o a `rejected` para descartarlas. La política RLS impide que visitantes anónimos lean reseñas pendientes/rechazadas o cambien su estado.

La clave `anon`/`publishable` está pensada para usarse en el navegador y se puede publicar. No coloques la clave `service_role` en este archivo. La seguridad de los permisos públicos depende de las políticas RLS de `schema.sql`.

## Avisos por correo de reseñas pendientes

La función `functions/notify-pending-review/index.ts` envía un correo cuando una reseña nueva queda `pending`. No envía notificaciones al aprobar, rechazar o actualizar una reseña. El correo incluye el nombre, destino, valoración y texto de la reseña para facilitar la moderación.

### 1. Configura el remitente en Resend

1. Crea una cuenta en [Resend](https://resend.com/) y genera una API key.
2. Como por ahora no tienes dominio propio, usa `onboarding@resend.dev` como `RESEND_FROM_EMAIL`. Resend limita los envíos de prueba al correo asociado a la cuenta; en este caso, debe ser `tierra.valientetours@gmail.com`.
3. Para enviar avisos a otros destinatarios o usar un remitente propio, verifica en Resend un dominio que controles y configura una dirección de ese dominio, por ejemplo `reservas@tudominio.com`.

No compartas la API key en el chat, el sitio ni en `supabase-config.js`. Guárdala únicamente como secreto de la función de Supabase.

### 2. Despliega la función en Supabase

Despliega `functions/notify-pending-review` en el proyecto conectado a este sitio. Con Supabase CLI, desde la raíz del repositorio:

```text
supabase functions deploy notify-pending-review --project-ref yvzhwqsgjmxjfmalkkeb
```

La función también valida el encabezado compartido `x-webhook-secret`. Si la despliegas desde el editor del Dashboard con la verificación JWT activada, el webhook debe incluir además el encabezado `Authorization: Bearer <legacy anon key>` del proyecto y el encabezado `apikey: <publishable key>`. No uses la clave `service_role`. La sección de configuración del Dashboard muestra si **Verify JWT with legacy secret** está activado; la opción de `config.toml` se aplica al desplegar con Supabase CLI, no al copiar el código en el editor web.

En **Edge Functions → Secrets**, guarda estos valores:

- `RESEND_API_KEY`: API key creada en Resend.
- `RESEND_FROM_EMAIL`: remitente verificado en Resend.
- `REVIEW_NOTIFICATION_EMAIL`: `tierra.valientetours@gmail.com`.
- `REVIEW_WEBHOOK_SECRET`: secreto aleatorio largo, generado para este webhook.
- `REVIEW_PROJECT_REF`: `yvzhwqsgjmxjfmalkkeb`.

### 3. Crea el webhook de base de datos

En Supabase, abre **Database → Webhooks → Create a new webhook** y configúralo así:

- Nombre: `notify-pending-review`
- Tabla: `public.reviews`
- Evento: solo `INSERT`
- Tipo: `HTTP Request`
- Método: `POST`
- URL: `https://yvzhwqsgjmxjfmalkkeb.supabase.co/functions/v1/notify-pending-review`
- Encabezados: `Content-type: application/json`; `x-webhook-secret` con el mismo valor guardado como `REVIEW_WEBHOOK_SECRET`; `Authorization` con `Bearer ` seguido por la clave anon heredada del proyecto; y `apikey` con esa misma clave anon. Nunca uses `service_role` ni una clave `sb_secret_`.

Guarda el webhook y envía una reseña real para probar. Debe quedar pendiente y recibirse el correo; luego podrás aprobarla desde **Table Editor → reviews**. No envíes una reseña de prueba falsa al sitio público. Si no llega, revisa **Edge Functions → Logs** y el estado de la entrega en Resend.

El webhook no sustituye la moderación manual. Si Resend o la función fallan temporalmente, la reseña permanece guardada como pendiente; revisa periódicamente la tabla además del correo.
