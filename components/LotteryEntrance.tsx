import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { BigNumber, ethers, ContractTransaction, ContractInterface } from "ethers"
import { useNotification } from "web3uikit"

interface ContractAddressesInterface {
    [key: string]: string[]
}

const LotteryEntrance = () => {
    const { chainId: chanIdHex, isWeb3Enabled, enableWeb3 } = useMoralis()
    const dispatch = useNotification()

    const [entranceFee, setEntranceFee] = useState("0")
    const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    const chainId = parseInt(chanIdHex || "-1").toString()
    const addresses = contractAddresses as ContractAddressesInterface
    const raffleAddress = addresses[chainId] ? addresses[chainId][0] : undefined

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
    })

    async function updateUI() {
        console.log("updateUI...")
        const entranceFeeFromContract = (await getEntranceFee()) as BigNumber
        const numberOfPlayersFromContract = (await getNumberOfPlayers()) as BigNumber
        const recentWinnerFromContract = (await getRecentWinner()) as string
        console.log(
            entranceFeeFromContract.toString(),
            numberOfPlayersFromContract.toString(),
            recentWinnerFromContract
        )
        setEntranceFee(entranceFeeFromContract.toString())
        setNumberOfPlayers(numberOfPlayersFromContract.toString())
        setRecentWinner(recentWinnerFromContract)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    async function listenForRecentWinnerEvent() {
        const ethereumWindow = (window as any).ethereum
        if (typeof ethereumWindow !== "undefined" && raffleAddress) {
            console.log("setting listener...")
            const provider = new ethers.providers.Web3Provider(ethereumWindow)
            const raffleContract = new ethers.Contract(
                raffleAddress,
                abi as ContractInterface,
                provider
            )
            const latestBlock = await provider.getBlockNumber()
            raffleContract.on("WinnerPicked", (txAddress, txData) => {
                console.log("I hear an event")
                if (txData.blockNumber > latestBlock) {
                    console.log("Received WinnerPicked event, updating UI...")
                    updateUI()
                }
            })
        }
    }

    useEffect(() => {
        listenForRecentWinnerEvent()
    }, [raffleAddress])

    const handleSuccess = async function (tx: ContractTransaction) {
        // Wait to actually confirm that the tx was confirmed
        await tx.wait(1)
        handleNewNotification()
        updateUI()
    }

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "TX Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div className="my-5">
            Lottery Entrance{" "}
            {raffleAddress ? (
                <div>
                    <button
                        disabled={isLoading || isFetching}
                        onClick={async () => {
                            await enterRaffle({
                                onSuccess: (tx) => handleSuccess(tx as ContractTransaction),
                                onError: (error) => console.log(error),
                            })
                        }}
                        className="flex flex-row items-center gap-x-3 bg-blue-500 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 my-3 rounded-md transition"
                    >
                        {isLoading ||
                            (isFetching && (
                                <div className="animate-spin h-5 w-5 border-b-2 rounded-full" />
                            ))}
                        Enter Raffle
                    </button>
                    <p>
                        Entrance fee {ethers.utils.formatUnits(entranceFee, "ether").toString()}ETH
                    </p>
                    <p>Number of players: {numberOfPlayers}</p>
                    <p> Recent winner: {recentWinner}</p>
                </div>
            ) : (
                <p>No Raffle address detected</p>
            )}
        </div>
    )
}

export default LotteryEntrance
