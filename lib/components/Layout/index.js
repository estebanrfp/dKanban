export default async () => {
  if (window.localStorage.getItem('keys')) {
    const { default: Kanban } = await import('../Kanban'/* webpackChunkName:"kanban" */)
    await Kanban()
  } else {
    const { default: Signing } = await import('../Signing'/* webpackChunkName:"signing" */)
    await Signing()
  }
}

