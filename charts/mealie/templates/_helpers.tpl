{{/*
Expand the name of the chart.
*/}}
{{- define "mealie.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "mealie.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "mealie.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mealie.labels" -}}
helm.sh/chart: {{ include "mealie.chart" . }}
{{ include "mealie.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "mealie.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mealie.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Namespace
*/}}
{{- define "mealie.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride }}
{{- end }}

{{/*
Public URL: config.baseUrl, or the first ingress host.
*/}}
{{- define "mealie.baseUrl" -}}
{{- if .Values.config.baseUrl }}
{{- .Values.config.baseUrl | trimSuffix "/" }}
{{- else if and .Values.ingress.enabled .Values.ingress.hosts }}
{{- printf "http%s://%s" (ternary "s" "" (not (empty .Values.ingress.tls))) (index .Values.ingress.hosts 0).host }}
{{- end }}
{{- end }}

{{/*
Hosts and networks Mealie may reach although they are private: config.httpAllowList,
plus the loopback address of the Bring bridge when it runs.
*/}}
{{- define "mealie.httpAllowList" -}}
{{- $list := .Values.config.httpAllowList | default list }}
{{- if .Values.bring.enabled }}
{{- $list = append $list "127.0.0.1" }}
{{- end }}
{{- join "," (uniq $list) }}
{{- end }}
