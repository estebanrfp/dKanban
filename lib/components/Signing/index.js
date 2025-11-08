import spinner from '../Spinner/index.js'
import alert from '../Alerts/index.js'

function copyTextToClipboard (text) {
  return navigator.clipboard.writeText(text).then(() => {
  alert('', '', 'Copied. Keep it in a safe place!', 'success', false, true)
    return true
  }, () => {
  alert('', '', 'Copy permission denied (you can save it manually).', 'warning', false, true)
    return false
  })
}

export default async function mountSigning ({ db, mount, onAuthenticated }) {
  const response = await fetch('./lib/components/Signing/template.html')
  const html = await response.text()
  mount.innerHTML = html

  const mnemonicInput = mount.querySelector('#mnemonic-input')
  const smartBtn = mount.querySelector('#smart-btn')
  const copyBtn = mount.querySelector('#copy-btn')
  const webauthnBtn = mount.querySelector('#webauthn-btn')

  let generatedMnemonic = null
  let awaitingSignIn = false

  const resetUI = () => {
    smartBtn.disabled = false
    smartBtn.textContent = 'Continue'
    copyBtn.hidden = true
    if (webauthnBtn) webauthnBtn.hidden = true
    awaitingSignIn = false
  }

  const finishAuth = identity => {
    if (identity?.address) {
  alert('', '', `Welcome, ${ identity.address }`, 'success', false, true)
    }
    if (typeof onAuthenticated === 'function') onAuthenticated()
  }

  async function loginWithMnemonic (mnemonic) {
    spinner('show')
    try {
      const identity = await db.sm.loginOrRecoverUserWithMnemonic(mnemonic)
      mnemonicInput.value = ''
      finishAuth(identity)
    } catch (e) {
  alert('', '', e?.message || 'Unable to sign in with that mnemonic.', 'warning', false, true)
    } finally {
      spinner('hide')
    }
  }

  async function generateMnemonicFlow () {
    spinner('show')
    try {
      const identity = await db.sm.startNewUserRegistration()
      if (identity?.mnemonic) {
        generatedMnemonic = identity.mnemonic
        mnemonicInput.value = generatedMnemonic
        mnemonicInput.focus()
        mnemonicInput.select()
  smartBtn.disabled = true
  smartBtn.textContent = 'Enter'
  copyBtn.hidden = false
  if (webauthnBtn) webauthnBtn.hidden = false
  alert('', '', 'Your mnemonic has been generated. Copy it to continue.', 'success', false, true)
      }
    } catch (e) {
  alert('', '', e?.message || 'Unable to generate a new account.', 'warning', false, true)
    } finally {
      spinner('hide')
    }
  }

  async function handleSmartButton () {
    const candidate = mnemonicInput.value.trim()
    if (generatedMnemonic) {
      // Segunda fase tras generar: login usando lo que está en el textarea
      await loginWithMnemonic(candidate)
      return
    }
    if (candidate) {
      // Primera pulsación con mnemonic: mostrar WebAuthn y cambiar a "Sign in"
      if (!awaitingSignIn) {
        awaitingSignIn = true
        if (webauthnBtn) webauthnBtn.hidden = false
        smartBtn.textContent = 'Sign in'
        return
      }
      // Segunda pulsación: iniciar sesión
      await loginWithMnemonic(candidate)
    } else {
      // Vacío → generar y mostrar en el mismo textarea
      await generateMnemonicFlow()
    }
  }

  async function handleCopy () {
    const text = mnemonicInput.value.trim()
    if (!text) return
  const ok = await copyTextToClipboard(text)
  // Enable continue even if copy permission is denied
  smartBtn.disabled = false
  }

  // Si el usuario modifica el textarea, volvemos al modo "Continuar"
  mnemonicInput.addEventListener('input', () => {
    const val = mnemonicInput.value.trim()
    if (!val) {
      generatedMnemonic = null
      resetUI()
      return
    }
    if (generatedMnemonic && val !== generatedMnemonic) {
      generatedMnemonic = null
      resetUI()
    } else if (!generatedMnemonic) {
  smartBtn.disabled = false
    }
  })

  smartBtn.addEventListener('click', handleSmartButton)
  copyBtn.addEventListener('click', handleCopy)
  
  // WebAuthn support
  const toBase64Url = buffer => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  async function saveWebAuthn () {
    try {
      if (!('credentials' in navigator) || !('PublicKeyCredential' in window)) {
        throw new Error('WebAuthn not supported in this browser.')
      }
      const candidate = mnemonicInput.value.trim()
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      const enc = new TextEncoder()
      const userIdSrc = candidate || (Math.random() + 1).toString(36).slice(2)
      let userId = enc.encode(userIdSrc)
      if (userId.length > 64) userId = userId.slice(0, 64)

      const publicKey = {
        rp: { name: 'dKanban', id: location.hostname },
        user: { id: userId, name: 'user@dkanban', displayName: 'dKanban User' },
        challenge,
        pubKeyCredParams: [ { type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 } ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: { userVerification: 'preferred' }
      }

      const cred = await navigator.credentials.create({ publicKey })
      if (!cred) throw new Error('WebAuthn creation was canceled or failed.')

      const record = {
        type: 'webauthn',
        id: cred.id,
        rawId: toBase64Url(cred.rawId),
        createdAt: Date.now(),
        rpId: location.hostname
      }
      try { await db.put(record, `webauthn-${record.rawId}`) } catch (_) {}
      try { localStorage.setItem(`webauthn-${record.rawId}`, JSON.stringify(record)) } catch (_) {}

      alert('', '', 'WebAuthn credential saved on this device.', 'success', false, true)
    } catch (e) {
      alert('', '', e?.message || 'Unable to save WebAuthn credential.', 'warning', false, true)
    }
  }

  if (webauthnBtn) webauthnBtn.addEventListener('click', saveWebAuthn)

  return () => {
    smartBtn.removeEventListener('click', handleSmartButton)
    copyBtn.removeEventListener('click', handleCopy)
    if (webauthnBtn) webauthnBtn.removeEventListener('click', saveWebAuthn)
    mnemonicInput.removeEventListener('input', () => {})
  }
}
