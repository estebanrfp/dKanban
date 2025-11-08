function Spinner (mode) {
  const spinner = document.querySelector('.spinner')
  if (!spinner) return

  if (mode === 'show') {
    spinner.classList.remove('fadeout')
  } else {
    spinner.classList.add('fadeout')
  }
}

export default Spinner
