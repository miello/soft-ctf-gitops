import { App, Chart, YamlOutputType } from 'cdk8s'
import { Application } from '../imports/argocd-application-argoproj.io'
import { AppProject } from '../imports/argocd-appproject-argoproj.io'
import { ChallengeNamespaceEnum } from './types/namespace'
import { IntOrString, KubeDeployment, KubeService, Quantity } from '../imports/k8s'
import { IngressRoute, IngressRouteSpecRoutesKind, IngressRouteSpecRoutesServicesPort } from '../imports/traefik-ingressroutes-traefik.io'
import { applyAreYouRealTemplate } from './templates/are-you-real'
import { applyBarQRCapmooTemplate } from './templates/barqr-capmoo'
import { applySecureSecretTemplate } from './templates/secure-secret'
import { applySimpleMathTemplate } from './templates/simple-math'
import { applySuperSecureSecretTemplate } from './templates/super-secure-secret'

const repositoryUrl = 'https://github.com/miello/soft-ctf-gitops'
const app = new App({
  yamlOutputType: YamlOutputType.FOLDER_PER_CHART_FILE_PER_RESOURCE,
  outdir: 'dist',
})

const appChart = new Chart(app, 'softctf-root')

const mainProject = new AppProject(appChart, 'argo-cd-project', {
  metadata: {
    name: 'argocd',
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

applyAreYouRealTemplate(app, appChart, mainProject.name)
applyBarQRCapmooTemplate(app, appChart, mainProject.name)
applySecureSecretTemplate(app, appChart, mainProject.name)
applySimpleMathTemplate(app, appChart, mainProject.name)
applySuperSecureSecretTemplate(app, appChart, mainProject.name)

app.synth()
