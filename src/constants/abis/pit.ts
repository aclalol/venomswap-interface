import { Interface } from '@ethersproject/abi'
import PIT_ABI from './pit.json'
import PIT_STAKING_ABI from './pit-staking.json'

const PIT_INTERFACE = new Interface(PIT_ABI)
const PIT_STAKING_INTERFACE = new Interface(PIT_STAKING_ABI)

export { PIT_ABI, PIT_INTERFACE, PIT_STAKING_ABI, PIT_STAKING_INTERFACE }
