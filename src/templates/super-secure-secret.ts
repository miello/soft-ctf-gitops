import { App, Chart } from 'cdk8s'
import { ChallengeNamespaceEnum } from '../types/namespace'
import {
  IntOrString,
  KubeDeployment,
  KubeService,
  Quantity,
} from '../../imports/k8s'
import imageInfo from '../images/super-secure-secret.json'
import { Application } from '../../imports/argocd-application-argoproj.io'
import { REPOSITORY_URL } from '../constants'
import { Secret } from 'cdk8s-plus-33'

const image = imageInfo['softctf-super-secure-secret']['image']
const tag = imageInfo['softctf-super-secure-secret']['tag']

export const applySuperSecureSecretTemplate = (app: App, rootChart: Chart, projectName: string) => {
  new Application(rootChart, 'argo-cd-application-super-secure-secret', {
    metadata: {
      name: 'softctf-super-secure-secret',
      namespace: 'argocd',
    },
    spec: {
      destination: {
        namespace: ChallengeNamespaceEnum.SOFTCTF_SUPER_SECURE_SECRET,
        server: 'https://kubernetes.default.svc',
      },
      project: projectName,
      source: {
        repoUrl: REPOSITORY_URL,
        targetRevision: 'main',
        path: 'dist/softctf-super-secure-secret',
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

  const chart = new Chart(app, 'softctf-super-secure-secret', {
    namespace: ChallengeNamespaceEnum.SOFTCTF_SUPER_SECURE_SECRET,
  })

  new Secret(chart, 'super-secure-secret-secret', {
    metadata: {
      name: 'super-secure-secret-secret',
    },
    immutable: true,
    stringData: {
      FLAG: 'softctf{Sh4mir_se(rET_SchEMe_KEy_LeaK4gE}',
    },
  })

  new KubeDeployment(chart, 'super-secure-secret-deployment', {
    metadata: {
      name: 'super-secure-secret-app',
    },
    spec: {
      selector: {
        matchLabels: {
          app: 'super-secure-secret-app',
        },
      },
      replicas: 2,
      template: {
        metadata: {
          labels: {
            app: 'super-secure-secret-app',
          },
        },
        spec: {
          imagePullSecrets: [
            {
              name: 'regcred',
            }
          ],
          containers: [
            {
              name: 'super-secure-secret-app',
              image: `${image}:${tag}`,
              envFrom: [{
                secretRef: {
                  name: 'super-secure-secret-secret',
                }
              }],
              ports: [
                {
                  containerPort: 1337,
                },
              ],
              imagePullPolicy: 'IfNotPresent',
              resources: {
                limits: {
                  cpu: Quantity.fromString('100m'),
                  memory: Quantity.fromString('128Mi'),
                },
                requests: {
                  cpu: Quantity.fromString('50m'),
                  memory: Quantity.fromString('64Mi'),
                },
              },
            },
          ],
        },
      },
    },
  })

  new KubeService(chart, 'super-secure-secret-service', {
    metadata: {
      name: 'super-secure-secret-service',
      namespace: ChallengeNamespaceEnum.SOFTCTF_SUPER_SECURE_SECRET,
    },
    spec: {
      selector: {
        app: 'super-secure-secret-app',
      },
      ports: [
        {
          name: 'tcp',
          port: 8083,
          targetPort: IntOrString.fromNumber(1337),
        },
      ],
      type: 'NodePort',
    },
  })
}
 