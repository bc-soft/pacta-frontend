import { env } from '../../env'
import { fakeApi } from './fakeApi'
import { realApi } from './realApi'

export const api = env.useFakeApi ? fakeApi : realApi

export { ApiError } from './client'
export type * from './types'
