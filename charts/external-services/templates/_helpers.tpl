{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "external-services.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels. Takes a dict with the root context as "root" and the service entry as "service".
*/}}
{{- define "external-services.labels" -}}
helm.sh/chart: {{ include "external-services.chart" .root }}
app.kubernetes.io/name: {{ .service.name }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
{{- end }}

{{/*
Namespace
*/}}
{{- define "external-services.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride }}
{{- end }}
