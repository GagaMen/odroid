{{/*
Expand the name of the chart.
*/}}
{{- define "homepage.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "homepage.fullname" -}}
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
{{- define "homepage.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "homepage.labels" -}}
helm.sh/chart: {{ include "homepage.chart" . }}
{{ include "homepage.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "homepage.selectorLabels" -}}
app.kubernetes.io/name: {{ include "homepage.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "homepage.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "homepage.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Namespace
*/}}
{{- define "homepage.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride }}
{{- end }}

{{- define "homepage.configMapDefaults" -}}
allowedHosts: gethomepage.dev # required, may need port. See gethomepage.dev/installation/#homepage_allowed_hosts
kubernetes.yaml: |
    mode: cluster
settings.yaml: ""
custom.css: ""
custom.js: ""
bookmarks.yaml: |
    - Developer:
        - Github:
            - abbr: GH
            href: https://github.com/
services.yaml: |
    - My First Group:
        - My First Service:
            href: http://localhost/
            description: Homepage is awesome

    - My Second Group:
        - My Second Service:
            href: http://localhost/
            description: Homepage is the best

    - My Third Group:
        - My Third Service:
            href: http://localhost/
            description: Homepage is 😎
widgets.yaml: |
    - kubernetes:
        cluster:
        show: true
        cpu: true
        memory: true
        showLabel: true
        label: "cluster"
        nodes:
        show: true
        cpu: true
        memory: true
        showLabel: true
    - resources:
        backend: resources
        expanded: true
        cpu: true
        memory: true
        network: default
    - search:
        provider: duckduckgo
        target: _blank
docker.yaml: ""
{{- end -}}
