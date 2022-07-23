import { ConnectButton } from "web3uikit"

export default function Header() {
    return (
        <nav>
            <div className="p-5 border-b-2 px-4 flex flex-row items-start justify-between">
                <h1 className="py-4 font-bold text-3xl">Decentralized Lottery</h1>
                <div className="py-2 ">
                    <ConnectButton moralisAuth={false} />
                </div>
            </div>
        </nav>
    )
}
