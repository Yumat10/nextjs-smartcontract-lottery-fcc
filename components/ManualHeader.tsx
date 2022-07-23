import { useEffect } from "react"
import { useMoralis } from "react-moralis"

export default function Header() {
    const { enableWeb3, account, isWeb3Enabled, Moralis, isWeb3EnableLoading } = useMoralis()

    const accountSliced = `${account?.slice(0, 6)}...${account?.slice(-4)}`

    useEffect(() => {
        if (isWeb3Enabled) return
        if (typeof window !== "undefined") {
            if (window.localStorage.getItem("connected")) {
                enableWeb3()
            }
        }
    }, [isWeb3Enabled])

    useEffect(() => {
        Moralis.onAccountChanged((account) => {
            console.log(`Account changed to ${account}`)
            if (!account) {
                window.localStorage.removeItem("connected")
            }
        })
    }, [])

    return (
        <div>
            {account ? (
                <div>Connected to {accountSliced}</div>
            ) : (
                <button
                    disabled={isWeb3EnableLoading}
                    onClick={async () => {
                        await enableWeb3()
                        if (typeof window !== "undefined") {
                            window.localStorage.setItem("connected", "injected")
                        }
                    }}
                >
                    Connect
                </button>
            )}
        </div>
    )
}
