const db = await window.gdb('dkanban', { rtc: true })

async function updateTask (data) {
  await db.put({ type: 'board', ...data }, 'kanban-board')
}

async function deleteTask (nodeID) {
  await db.remove(nodeID)
}

export {
  updateTask,
  deleteTask
}
