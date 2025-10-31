import { App, Chart, Size } from 'cdk8s'
import imageInfo from '../images/glossary-shop.json'
import {
  Secret,
  Deployment,
  ImagePullPolicy,
  Cpu,
  Service,
  ServiceType,
  Ingress,
  IngressBackend,
  TlsSecret,
  Env,
} from 'cdk8s-plus-33'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import { GlobalNamespaceEnum } from '../types/namespace'

const image = imageInfo['softctf-glossary-shop']['image']
const tag = imageInfo['softctf-glossary-shop']['tag']

const dbImage = imageInfo['softctf-glossary-shop-db']['image']
const dbTag = imageInfo['softctf-glossary-shop-db']['tag']

export const applyGlossaryShopTemplate = (
  app: App,
  rootChart: Chart,
  projectName: string,
) => {
  new Application(rootChart, 'argo-cd-application-glossary-shop', {
    metadata: {
      name: 'softctf-glossary-shop',
      namespace: 'argocd',
    },
    spec: {
      destination: {
        namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
        server: 'https://kubernetes.default.svc',
      },
      project: projectName,
      source: {
        repoUrl: REPOSITORY_URL,
        targetRevision: 'main',
        path: 'dist/softctf-glossary-shop',
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

  const chart = new Chart(app, 'softctf-glossary-shop', {
    namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
  })

  const dbSecret = new Secret(chart, 'glossary-shop-db-secret', {
    stringData: {
      POSTGRES_DB: 'glossary',
      POSTGRES_USER: 'glossary_user',
      POSTGRES_PASSWORD: 'supersecurepassword',
    }
  })

  const dockerAuthSecret = Secret.fromSecretName(chart, 'regcred', 'regcred')

  const dbDeployment = new Deployment(chart, 'glossary-shop-db-deployment', {
    metadata: {
      name: 'glossary-shop-db',
    },
    replicas: 1,
    containers: [
      {
        image: `${dbImage}:${dbTag}`,
        name: 'glossary-shop-db',
        ports: [{ number: 5432 }],
        imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
        resources: {
          cpu: {
            limit: Cpu.millis(100),
            request: Cpu.millis(50),
          },
          memory: {
            limit: Size.mebibytes(128),
            request: Size.mebibytes(64),
          },
        },
        securityContext: {
          readOnlyRootFilesystem: false,
        },
      },
    ],
    dockerRegistryAuth: dockerAuthSecret
  })

  const dbService = new Service(chart, 'glossary-shop-db-service', {
    metadata: {
      name: 'glossary-shop-db-service',
      namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
    },
    type: ServiceType.CLUSTER_IP,
    selector: dbDeployment,
    ports: [
      {
        port: 5432,
        targetPort: 5432,
        name: 'postgresql',
      },
    ],
  })

  const glossaryShopSecret = new Secret(chart, 'glossary-shop-secret', {
    stringData: {
      DATABASE_URL: `postgresql://glossary_user:supersecurepassword@${dbService.name}.${GlobalNamespaceEnum.SOFTCTF_GLOBAL}.svc.cluster.local:5432/glossary`,
      MODE: "production",

      API_BASE_URL: "http://localhost:3000/api",
    }
  })

  const kubeDeployment = new Deployment(
    chart,
    'glossary-shop-deployment',
    {
      metadata: {
        name: 'glossary-shop-app',
      },
      replicas: 3,
      containers: [
        {
          image: `${image}:${tag}`,
          name: 'glossary-shop-app',
          ports: [{ number: 3000 }],
          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
          envFrom: [
            Env.fromSecret(glossaryShopSecret),
          ],
          resources: {
            cpu: {
              limit: Cpu.millis(100),
              request: Cpu.millis(50),
            },
            memory: {
              limit: Size.mebibytes(256),
              request: Size.mebibytes(128),
            },
          },
          securityContext: {
            ensureNonRoot: true,
            readOnlyRootFilesystem: false,
            user: 1000,
          },
        },
      ],
      dockerRegistryAuth: dockerAuthSecret,
    },
  )

  const service = new Service(chart, 'glossary-shop-service', {
    metadata: {
      name: 'glossary-shop-service',
      namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
    },
    type: ServiceType.CLUSTER_IP,
    selector: kubeDeployment,
    ports: [
      {
        port: 80,
        targetPort: 3000,
        name: 'http',
      },
    ],
  })

  new Ingress(chart, 'glossary-shop-ingress', {
    metadata: {
      name: 'glossary-shop-ingress',
      namespace: GlobalNamespaceEnum.SOFTCTF_GLOBAL,
      annotations: {
        'cert-manager.io/cluster-issuer': 'letsencrypt-softctf',
        'nginx.ingress.kubernetes.io/force-ssl-redirect': 'true',
      }
    },
    tls: [
      {
        hosts: ['softctf-glossary-shop.miello.dev'],
        secret: TlsSecret.fromSecretName(chart, 'glossary-shop-tls', 'glossary-shop-tls'),
      },
    ],
    rules: [
      {
        host: 'softctf-glossary-shop.miello.dev',
        backend: IngressBackend.fromService(service),
      },
    ],
  })

  return {
    service,
  }
}
