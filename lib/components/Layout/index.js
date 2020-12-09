export default async () => {
  const keys = window.localStorage.getItem('keys') || null
  if (keys) {
    await import('../Kanban'/* webpackChunkName:"kanban" */).then(module => module.default())
  } else {
    await import('../Signing'/* webpackChunkName:"signing" */).then(module => module.default())
  }
}
