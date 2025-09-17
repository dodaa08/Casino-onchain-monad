'use client'
import { useEffect, useRef } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { createUser } from '@/app/services/api'
import { useState } from 'react'

export default function WalletEvents() {
  const { address, isConnected } = useAccount()
  const last = useRef<string | null>(null)
  const {data, isLoading} = useBalance({address})
  const [userbalance, setUserbalance] = useState(0)

  useEffect(() => {
    if(isLoading){
     console.log("Loading... userbalance")
        return;
    }
    if(address && data){
      setUserbalance(Number(data?.value))
    }       
  }, [address, data])

  useEffect(() => {
    if (!isConnected || !address) return
    if (last.current === address) return
    if (sessionStorage.getItem(`user-created:${address}`)) {
      last.current = address
      return
    }
    ;(async () => {
      try {
        const out = await createUser({ walletAddress: address, balance: userbalance })
        console.log(out?.exists ? '[USER] already exists' : '[USER] created')
        sessionStorage.setItem(`user-created:${address}`, '1')
        last.current = address
      } catch (e) {
        console.error('[USER] create failed', e)
      }
    })()
  }, [isConnected, address])

  return null
}