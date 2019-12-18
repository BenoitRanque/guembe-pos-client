export function AUTH (state, { token, session } = { token: null, session: null }) {
  state.token = token
  state.session = session
}

export function REFRESH_TOKEN_TASK (state, task = null) {
  state.refreshTokenTask = task
}
