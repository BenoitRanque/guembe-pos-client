export function SESSION (state, { Token, Employee } = { Token: null, Employee: null }) {
  state.Token = Token
  state.Employee = Employee
}

export function REFRESH_TOKEN_TASK (state, task = null) {
  state.refreshTokenTask = task
}
