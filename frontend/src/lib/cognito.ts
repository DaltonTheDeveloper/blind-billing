const REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1'
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || ''
const ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`

async function cognitoRequest(action: string, payload: Record<string, unknown>) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.__type || 'Auth error')
  return data
}

export async function signIn(email: string, password: string) {
  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  })
  const result = data.AuthenticationResult
  storeTokens(result.IdToken, result.AccessToken, result.RefreshToken)
  return result.IdToken
}

export async function signUp(email: string, password: string) {
  await cognitoRequest('SignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  })
}

export async function confirmSignUp(email: string, code: string) {
  await cognitoRequest('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  })
}

export async function refreshSession(): Promise<string | null> {
  const refreshToken = localStorage.getItem('bb_refresh_token')
  if (!refreshToken) return null
  try {
    const data = await cognitoRequest('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    })
    const result = data.AuthenticationResult
    storeTokens(result.IdToken, result.AccessToken, result.RefreshToken || refreshToken)
    return result.IdToken
  } catch {
    clearTokens()
    return null
  }
}

function storeTokens(idToken: string, accessToken: string, refreshToken: string) {
  localStorage.setItem('bb_id_token', idToken)
  localStorage.setItem('bb_access_token', accessToken)
  localStorage.setItem('bb_refresh_token', refreshToken)
}

export function getIdToken(): string | null {
  return localStorage.getItem('bb_id_token')
}

export function getTokenPayload(): { sub: string; email: string } | null {
  const token = getIdToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return { sub: payload.sub, email: payload.email || payload['cognito:username'] || '' }
  } catch {
    return null
  }
}

export function clearTokens() {
  localStorage.removeItem('bb_id_token')
  localStorage.removeItem('bb_access_token')
  localStorage.removeItem('bb_refresh_token')
  localStorage.removeItem('bb_api_key')
}

export function isAuthenticated(): boolean {
  return getTokenPayload() !== null
}
