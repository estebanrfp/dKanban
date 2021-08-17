import spinner from '../Spinner'
import alert from '../Alerts'
import { user, SEA } from '../../Gun'
import html from './template.html?raw'
import './styles.css'

function Signing () {
  document.querySelector('.Layout').innerHTML = html
  // let accountName = ''

  function copyKeys (keys) {
    navigator.clipboard.writeText(JSON.stringify(keys)).then(() => {
      alert('', '', 'Keys Copied, keep them in a safe place !', 'success', false, true)
    }, () => {
      alert('Copy permissions denied ', 'warning')
    })
  }

  function login (keys) {
    spinner('show')

    window.localStorage.setItem('keys', JSON.stringify(keys))

    user.auth(keys)

    if (user.is) {
      user.get('name').once(async name => {
        alert('', '', `Welcome to [${ name }] account profile !`, 'success', false, true)
        spinner('hide')
        // document.querySelector('.wrap').style.visibility = 'hidden' // "visible"
        await import('../Kanban'/* webpackChunkName:"kanban" */).then(module => module.default())
      })
    }

    // user.auth(keys, ack => {
    //   if (ack.err) {
    //     alert(ack.err)
    //     // document.querySelector('button#send').disabled = false
    //   } else {
    //     alert('hi')
    //     // alert(`Welcome to [${ name }] account profile !`, 'success')
    //   }
    //   spinner('hide')
    // })
  }

  async function createAccount (event) {
    const accountName = event.target.value

    alert('', '', `creating [${ accountName }] account profile ...`, 'success', false, true)

    event.target.value = ''
    const keys = await SEA.pair()
    // const keys = await user._.sea
    login(keys)
    copyKeys(keys)
    user.get('name').put(accountName)
    // if (user.is) {
    //   user.get('name').put(accountName)
    // }
    await import('../Kanban'/* webpackChunkName:"kanban" */).then(module => module.default())
  }

  const input = document.querySelector('#inputData')

  input.oncut = input.oncopy = input.onpaste = event => {
    const content = event.clipboardData.getData('text/plain')
    const re = /^(?=.*\bpub\b)(?=.*\bpriv\b)(?=.*\bepub\b)(?=.*\bepriv\b).*$/
    const validKeys = re.test(String(content))

    if (validKeys) {
      const accountKeys = JSON.parse(event.clipboardData.getData('text/plain'))
      login(accountKeys)
      console.log(`${ event.type } - ${ event.clipboardData.getData('text/plain') }`)
    } else {
      alert('', '', 'Please enter a valid keys !', 'warning', false, true)
    }
    return false
  }

  input.onchange = e => createAccount(e)

  // input.oninput = () => {
  //   result.innerHTML = input.value
  // }

  // input.onmouseover = () => {
  //   result.innerHTML = 'type new namespace'
  // }

  // input.onmouseout = () => {
  //   result.innerHTML = 'or paste your Keys'
  // }

  // check if user already logged in
  const keys = window.localStorage.getItem('keys')
  if (keys) {
    login(JSON.parse(keys))
  } else {
    console.log('no localstorage key found')
  }
}

// const signin = new Signin()
export default Signing
