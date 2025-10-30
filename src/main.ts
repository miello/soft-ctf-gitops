import { App, Chart, YamlOutputType } from 'cdk8s'
import { Application } from '../imports/argocd-application-argoproj.io'
import { AppProject } from '../imports/argocd-appproject-argoproj.io'
import { ChallengeNamespaceEnum } from './types/namespace'
import { IntOrString, KubeDeployment, KubeService, Quantity } from '../imports/k8s'
import { IngressRoute, IngressRouteSpecRoutesKind, IngressRouteSpecRoutesServicesPort } from '../imports/traefik-ingressroutes-traefik.io'

const repositoryUrl = 'https://github.com/miello/soft-ctf-gitops.git'
const app = new App({
  yamlOutputType: YamlOutputType.FOLDER_PER_CHART_FILE_PER_RESOURCE,
  outdir: 'dist',
})

const appChart = new Chart(app, 'softctf-root')

const mainProject = new AppProject(appChart, 'argo-cd-project', {
  metadata: {
    name: 'argo-cd',
    namespace: 'argocd',
  },
  spec: {
    clusterResourceWhitelist: [{ group: '*', kind: '*' }],
    sourceRepos: ['*'],
    destinations: [
      { namespace: 'argocd', server: 'https://kubernetes.default.svc' },
      { namespace: 'kube-system', server: 'https://kubernetes.default.svc' },
      { namespace: 'cert-manager', server: 'https://kubernetes.default.svc' },
      { namespace: 'traefik', server: 'https://kubernetes.default.svc' },
      ...Object.values(ChallengeNamespaceEnum).map((ns) => ({
        namespace: ns,
        server: 'https://kubernetes.default.svc',
      })),
    ],
  },
})

new Application(appChart, 'argo-cd-application', {
  metadata: {
    name: 'soft-ctf-applications',
    namespace: 'argocd',
  },
  spec: {
    destination: {
      namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_READY,
      server: 'https://kubernetes.default.svc',
    },
    project: mainProject.name,
    source: {
      repoUrl: repositoryUrl,
      targetRevision: 'main',
      path: 'dist/softctf-are-you-ready',
    },
    syncPolicy: {
      syncOptions: ['CreateNamespace=true'],
      automated: {
        prune: true,
        selfHeal: true,
      },
    },
  },
})

const AreYouReadyChart = new Chart(app, 'softctf-are-you-ready', {
  namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_READY,
})

new KubeDeployment(AreYouReadyChart, 'are-you-ready-app', {
  metadata: {
    name: 'are-you-ready-app',
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'are-you-ready-app',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          app: 'are-you-ready-app',
        },
      },
      spec: {
        containers: [
          {
            name: 'are-you-ready-app',
            image: 'nginx:latest',
            ports: [
              {
                containerPort: 80,
              },
            ],
            resources: {
              limits: {
                cpu: Quantity.fromString('100m'),
                memory: Quantity.fromString('128Mi'),
              },
              requests: {
                cpu: Quantity.fromString('50m'),
                memory: Quantity.fromString('128Mi'),
              },
            }
          },
        ],
      },
    },
  },
})

new KubeService(AreYouReadyChart, 'are-you-ready', {
  metadata: {
    name: 'are-you-ready-service',
    namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_READY,
  },
  spec: {
    selector: {
      app: 'are-you-ready-app',
    },
    ports: [
      {
        port: 80,
        targetPort: IntOrString.fromNumber(80),
      },
      {
        port: 443,
        targetPort: IntOrString.fromNumber(443),
      }
    ],
    type: 'ClusterIP',
  },
})

new IngressRoute(AreYouReadyChart, 'are-you-ready-ingress', {
  metadata: {
    name: 'are-you-ready-ingress',
    namespace: ChallengeNamespaceEnum.SOFTCTF_ARE_YOU_READY,
  },
  spec: {
    entryPoints: ['web', 'websecure'],
    routes: [
      {
        match: 'Host(`test-database-helloworld.miello.dev`)',
        kind: IngressRouteSpecRoutesKind.RULE,
        services: [
          {
            name: 'are-you-ready-service',
            port: IngressRouteSpecRoutesServicesPort.fromNumber(80),
          },
        ],
      },
    ],
  },
})

app.synth()
