# Mealie

[Mealie](https://mealie.io/) is a recipe manager and meal planner. It imports recipes from a
URL, scales them, plans them onto a weekly calendar and turns the plan into a shopping list.
Users are organised in households that share recipes, meal plans and lists.

## Features

- Recipe import from most recipe websites (schema.org data), or entered by hand
- Meal planner with a calendar per meal type, random suggestions and rules
- Shopping lists filled from recipes or a whole meal plan, merged by food and unit
- Households and groups; new users join by invitation
- Optional sidecar that sends ingredients to a [Bring!](https://www.getbring.com/) list
  without making Mealie reachable from the internet
- Single pod, SQLite as database

## Architecture

```
 ingress ──▶ mealie :9000 ──recipe action / notifier──▶ bring bridge 127.0.0.1:8742 ──▶ Bring! API
               │
             data volume (SQLite, images, UI backups)
```

The bridge is [mealie-bring-api](https://github.com/felixschndr/mealie-bring-api). It shares
the pod with Mealie and listens on loopback only: it has no authentication of its own, and
Mealie is the only client it needs.

## Installation

### As Part of Platform

```yaml
# platform/values.yaml
mealie:
  enabled: true
  namespaceOverride: mealie
  persistence:
    data:
      storageClass: longhorn-retain
      labels:
        odroid/backup-policy: gfs
  bring:
    enabled: true
    listName: <name of the Bring list>
  ingress:
    enabled: true
    annotations:
      cert-manager.io/cluster-issuer: lets-encrypt
    hosts:
      - host: mealie.your-domain.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: mealie-tls
        hosts:
          - mealie.your-domain.com
```

`bring.username` and `bring.password` come from Bitwarden through
[`secrets/mapping.yaml`](../../secrets/mapping.yaml) (item `bring`), not from `values.yaml`.

### Standalone

```bash
helm install mealie ./charts/mealie -n mealie --create-namespace -f values.yaml
```

## Configuration

### Image

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Container image repository | `ghcr.io/mealie-recipes/mealie` |
| `image.tag` | Container image tag | `v3.29.0` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |

### Server

| Parameter | Description | Default |
|-----------|-------------|---------|
| `config.baseUrl` | Public URL (`BASE_URL`); empty means derived from the first ingress host | `""` |
| `config.timeZone` | Time zone (`TZ`) | `Europe/Berlin` |
| `config.allowSignup` | Sign-up without an invitation (`ALLOW_SIGNUP`) | `false` |
| `config.httpAllowList` | Private hosts or CIDRs Mealie may reach (`HTTP_ALLOW_LIST`) | `[]` |
| `env` | Additional environment variables, passed verbatim | `[]` |
| `strategy.type` | Deployment update strategy | `Recreate` |

Every other [backend setting](https://docs.mealie.io/documentation/getting-started/installation/backend-config/)
can be passed through `env`.

### Bring Bridge

| Parameter | Description | Default |
|-----------|-------------|---------|
| `bring.enabled` | Run the bridge sidecar | `false` |
| `bring.image` | Bridge image | `ghcr.io/felixschndr/mealie-bring-api:1.3.1` |
| `bring.username` | Bring account email. **Required** with `bring.enabled` | `""` |
| `bring.password` | Bring account password. **Required** with `bring.enabled` | `""` |
| `bring.listName` | Exact name of the target list (case-insensitive). **Required** | `""` |
| `bring.mealieApiKey` | Mealie API key; enables moving shopping lists | `""` |
| `bring.shoppingListUuid` | Only move items of this Mealie list; empty means all | `""` |
| `bring.port` | Port on 127.0.0.1 | `8742` |
| `bring.resources` | CPU/memory for the bridge | `10m` / `48Mi`, limit `192Mi` |

Credentials and the API key are rendered into the chart's Secret; changing them restarts the
pod (checksum annotation).

### Persistence

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.data.*` | SQLite database, recipe images, backups made in the UI | `2Gi` |

The volume takes `enabled`, `size`, `accessMode`, `storageClass` and `labels`.

### Service, Ingress, Probes and Resources

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.port` | Service port (the container always listens on 9000) | `9000` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `startupProbe` | `GET /api/app/about`, up to five minutes | See values.yaml |
| `livenessProbe` / `readinessProbe` | `GET /api/app/about` | See values.yaml |
| `resources` | CPU/memory for Mealie | `100m` / `256Mi`, limit `1Gi` |

## Initial Setup

1. Log in with the account Mealie creates on its first start, `changeme@example.com` /
   `MyPassword`, and change both right away. Until then anyone who reaches the ingress is
   admin.
2. Admin settings → *Site Settings*: language and first day of the week. Foods and units
   can be seeded in the chosen language under *Data Management*.
3. Invite further users from the household settings. Invitation links contain `BASE_URL`.
4. Import a first recipe by URL and check that the ingredients were split into amount, unit
   and food.

## Bring!

Mealie's own *Send to Bring* button uses a Bring deeplink: Bring's servers then fetch the
recipe from Mealie, so Mealie would have to be reachable from the internet. The bridge does
the opposite and pushes the ingredients through Bring's API, logged in with `bring.username`.

Since v3.26 Mealie refuses server-side requests to private addresses unless they are on
`HTTP_ALLOW_LIST`. With `bring.enabled` the chart adds `127.0.0.1` to that list; this also lets
URL imports reach other services listening on loopback inside the pod, which are Mealie and
the bridge.

### Recipe → Bring

*Data Management* → *Recipe Actions* → *Create*, as an admin:

- Title: shown to users, e.g. `Bring`
- URL: `http://127.0.0.1:8742/`
- Type: `POST`

The action then appears in the recipe menu under *Recipe Actions* and sends the ingredients,
scaled to the selected servings. Foods marked *On Hand* (Data Management → Foods) are skipped,
which suits staples such as salt. Ingredients that were never split into food and amount are
sent as their full text.

### Shopping List → Bring

This needs `bring.mealieApiKey`: create a token under Profile → *API Tokens*, store it, deploy.
The bridge moves all items of a Mealie shopping list (or of `bring.shoppingListUuid` only) to
Bring and removes them from Mealie. Two ways to trigger it, and they exclude each other:

- **Manually**, as a second recipe action with URL
  `http://127.0.0.1:8742/move-ingredients-from-shopping-list`. Mealie's lists stay usable as
  lists in their own right.
- **Automatically**, as a notifier in the household settings with the Apprise URL
  `json://127.0.0.1:8742/move-ingredients-from-shopping-list` and the shopping list events
  enabled. Every *Add to list* in Mealie, including a whole meal plan, ends up in Bring a few
  seconds later; Mealie's shopping list only serves as a transit area then.

## Home Assistant

The [Mealie integration](https://www.home-assistant.io/integrations/mealie) shows the meal
plan as calendars (one per meal type) and each shopping list as a to-do list, and offers
actions such as `mealie.set_mealplan` and `mealie.import_recipe`. It needs Mealie 3.2 or
newer.

- URL: `http://<release>-mealie.<namespace>.svc.cluster.local:9000`, e.g.
  `http://platform-mealie.mealie.svc.cluster.local:9000`. The integration talks to the API
  directly; the ingress is not involved.
- API token: Profile → *API Tokens* in Mealie, preferably of a user created for Home
  Assistant.

## Tips

### Backup Configuration

Label the data volume so that [Velero](../velero/README.md) backs it up (see the
installation example above). The namespace has to be listed in `scope.namespaces` of the
[Velero chart](../velero/values.yaml).

The snapshot is crash-consistent: SQLite recovers from it like from a power cut. Mealie's
own backups (Admin → *Backups*) write a consistent ZIP of database and images onto the same
volume and are the way to move data between instances or across a database change.

### Recreate, Not RollingUpdate

The database is a SQLite file on a ReadWriteOnce volume; a rolling update would start the
new pod while the old one still holds it. The price is a minute of downtime per upgrade.

### Login Duration

A session token is valid for 48 hours (`TOKEN_TIME`) and is refreshed while the app is in
use. *Remember me* on the login page only decides whether the cookie survives closing the
browser. A device that sits unused for longer, such as a wall tablet, can be given a longer
lifetime through `env` (at most 9600 hours).

### What Leaves the Cluster

URL imports fetch the recipe page and its images from the source website. With the bridge,
ingredients go to Bring's API. Mealie's AI features (ingredient parsing, image import) are
off unless an OpenAI-compatible provider is configured through `env`.

## Schema

The chart's `values.schema.json` enables IDE validation and autocompletion for `values.yaml`. It is generated from the TypeScript type definitions in `values.schema.ts` using [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator).

To regenerate after modifying `values.schema.ts`:

```bash
npm run generate:mealie
```

Or regenerate all schemas at once:

```bash
npm run generate:all
```

## Links

- [Mealie Documentation](https://docs.mealie.io/)
- [Backend Configuration](https://docs.mealie.io/documentation/getting-started/installation/backend-config/)
- [Mealie GitHub](https://github.com/mealie-recipes/mealie)
- [mealie-bring-api](https://github.com/felixschndr/mealie-bring-api)
- [Home Assistant Mealie Integration](https://www.home-assistant.io/integrations/mealie)
