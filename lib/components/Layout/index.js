export default async () => {
  window.localStorage.getItem('keys')
    ? await import('../Kanban'/* webpackChunkName:"kanban" */).then(module => module.default())
    : await import('../Signing'/* webpackChunkName:"signing" */).then(module => module.default())
}
